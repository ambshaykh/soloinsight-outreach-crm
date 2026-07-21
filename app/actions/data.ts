"use server";

// NOTE: a `"use server"` file may only export async functions — Next.js
// build-fails on any other export (this is why `export const maxDuration`
// used to live here got removed). That's fine: the batching below already
// cuts a 200+ row import from 800-1,000+ sequential round trips down to
// roughly 5-10, so it finishes well within any platform's default timeout
// without needing a raised limit.

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { AccountStatus, ContactStatus, PriorityLevel } from "@/lib/types/database";

/** Runs `worker` over `items` with at most `concurrency` requests in flight
 *  at once — batches DB round trips without opening hundreds of connections
 *  at the same time. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

/** Splits an array into fixed-size chunks. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/* ---------------------------------------------------------------------- */
/* CSV helpers — hand-rolled, RFC4180-compliant (quoted fields, embedded  */
/* commas/newlines, escaped quotes) so no extra npm dependency is needed. */
/* ---------------------------------------------------------------------- */

function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return columns ? columns.join(",") : "";
  const headers = columns ?? Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

/** Parses CSV text into rows of string cells, respecting quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** Turns parsed CSV rows into an array of lowercase-keyed objects using the header row. */
function csvToObjects(csvText: string): { rows: Record<string, string>[]; error?: string } {
  const parsed = parseCsv(csvText.trim());
  if (parsed.length < 2) return { rows: [], error: "CSV has no data rows." };
  const headers = parsed[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = parsed.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
  return { rows };
}

const ACCOUNT_STATUSES: AccountStatus[] = [
  "new", "assigned", "in_progress", "engaged", "meeting_booked", "not_interested", "closed", "stale",
];
const CONTACT_STATUSES: ContactStatus[] = [
  "new", "assigned", "first_touch_sent", "called", "follow_up_needed",
  "positive_reply", "meeting_booked", "not_interested", "wrong_person", "closed",
];
const PRIORITIES: PriorityLevel[] = ["low", "medium", "high", "urgent"];

function pickEnum<T extends string>(value: string | undefined, allowed: T[], fallback: T): T {
  const v = (value ?? "").trim().toLowerCase().replace(/\s+/g, "_") as T;
  return allowed.includes(v) ? v : fallback;
}

/* ---------------------------------------------------------------------- */
/* Export                                                                  */
/* ---------------------------------------------------------------------- */

const ACCOUNT_EXPORT_COLUMNS = [
  "id", "company_name", "domain", "industry", "region", "company_size",
  "source", "status", "priority", "icp_score", "notes", "last_touched_at", "next_follow_up_at",
];

const CONTACT_EXPORT_COLUMNS = [
  "id", "company_name", "first_name", "last_name", "title", "email", "phone",
  "linkedin_url", "status", "priority", "notes", "last_contacted_at", "next_follow_up_at",
];

export async function exportAccountsCsv() {
  await requireProfile();
  const supabase = createClient();
  const { data } = await supabase.from("accounts").select(ACCOUNT_EXPORT_COLUMNS.join(", "));
  return toCsv((data as any) ?? [], ACCOUNT_EXPORT_COLUMNS);
}

export async function exportContactsCsv() {
  await requireProfile();
  const supabase = createClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, title, email, phone, linkedin_url, status, priority, notes, last_contacted_at, next_follow_up_at, account:accounts(company_name)");
  const rows = ((data as any) ?? []).map((r: any) => ({ ...r, company_name: r.account?.company_name ?? "" }));
  return toCsv(rows, CONTACT_EXPORT_COLUMNS);
}

export async function accountCsvTemplate() {
  return ACCOUNT_EXPORT_COLUMNS.filter((c) => c !== "id").join(",") + "\nAcme Inc,acme.com,Technology,North America,51-200,Referral,new,medium,60,Great fit for our ICP,,";
}

export async function contactCsvTemplate() {
  return CONTACT_EXPORT_COLUMNS.filter((c) => c !== "id").join(",") + "\nAcme Inc,Jane,Doe,VP Sales,jane@acme.com,+1-555-0100,https://linkedin.com/in/janedoe,new,medium,Met at conference,,";
}

/* ---------------------------------------------------------------------- */
/* Import                                                                  */
/* ---------------------------------------------------------------------- */

/**
 * Bulk-resolves account IDs for a whole CSV in a small, fixed number of
 * round trips instead of one (or three) round trips per row:
 *   1. fetch every existing account's id/company_name/domain once
 *   2. insert every not-yet-seen company in a single bulk insert
 * Returns a lowercased-company-name -> account id map.
 */
async function resolveAccountIdsInBulk(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  companyNames: string[],
): Promise<Map<string, string>> {
  const byName = new Map<string, string>();
  const wanted = Array.from(new Set(companyNames.map((c) => c.trim().toLowerCase()).filter(Boolean)));
  if (wanted.length === 0) return byName;

  const { data: existing } = await supabase.from("accounts").select("id, company_name, domain");
  for (const acc of existing ?? []) {
    if (acc.company_name) byName.set(String(acc.company_name).trim().toLowerCase(), acc.id);
  }

  const toCreate = wanted.filter((name) => !byName.has(name));
  if (toCreate.length === 0) return byName;

  // Preserve original casing for the new rows (grab the first raw value seen per lowercased key).
  const rawByLower = new Map<string, string>();
  for (const c of companyNames) {
    const key = c.trim().toLowerCase();
    if (key && !rawByLower.has(key)) rawByLower.set(key, c.trim());
  }

  for (const batch of chunk(toCreate, 500)) {
    const { data: created, error } = await supabase
      .from("accounts")
      .insert(
        batch.map((key) => ({
          company_name: rawByLower.get(key) ?? key,
          status: "new" as const,
          priority: "medium" as const,
          icp_score: 50,
          owner_id: profileId,
          created_by: profileId,
        })),
      )
      .select("id, company_name");
    if (!error) {
      for (const acc of created ?? []) byName.set(String(acc.company_name).trim().toLowerCase(), acc.id);
    }
  }

  return byName;
}

export async function importAccountsCsv(csvText: string) {
  const profile = await requireProfile();
  const supabase = createClient();
  const { rows, error: parseError } = csvToObjects(csvText);
  if (parseError) return { error: parseError, imported: 0, updated: 0 };

  const errors: string[] = [];
  const validRows = rows
    .map((row, i) => ({ row, i, companyName: row.company_name || row.company || "" }))
    .filter(({ companyName, i }) => {
      if (!companyName) errors.push(`Row ${i + 2}: missing company_name, skipped.`);
      return !!companyName;
    });

  // One bulk fetch covers domain- and name-matching for every row up front,
  // instead of up to two `ilike` round trips per row.
  const { data: existing } = await supabase.from("accounts").select("id, company_name, domain");
  const byDomain = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const acc of existing ?? []) {
    if (acc.domain) byDomain.set(String(acc.domain).trim().toLowerCase(), acc.id);
    if (acc.company_name) byName.set(String(acc.company_name).trim().toLowerCase(), acc.id);
  }

  const toInsert: Record<string, unknown>[] = [];
  const toUpdate: { id: string; payload: Record<string, unknown>; rowNum: number }[] = [];

  for (const { row, i, companyName } of validRows) {
    const payload = {
      company_name: companyName,
      domain: row.domain || null,
      industry: row.industry || null,
      region: row.region || null,
      company_size: row.company_size || row.size || null,
      source: row.source || null,
      status: pickEnum<AccountStatus>(row.status, ACCOUNT_STATUSES, "new"),
      priority: pickEnum<PriorityLevel>(row.priority, PRIORITIES, "medium"),
      icp_score: row.icp_score && !Number.isNaN(Number(row.icp_score)) ? Number(row.icp_score) : 50,
      notes: row.notes || null,
    };

    const existingId =
      row.id ||
      (row.domain && byDomain.get(row.domain.trim().toLowerCase())) ||
      byName.get(companyName.trim().toLowerCase()) ||
      null;

    if (existingId) toUpdate.push({ id: existingId, payload, rowNum: i + 2 });
    else toInsert.push({ ...payload, owner_id: profile.id, created_by: profile.id });
  }

  let imported = 0;
  let updated = 0;

  for (const batch of chunk(toInsert, 500)) {
    const { error } = await supabase.from("accounts").insert(batch);
    if (error) errors.push(`Insert batch: ${error.message}`);
    else imported += batch.length;
  }

  // Updates still need one request per row (Postgrest has no per-row-varying
  // bulk update), but run them with limited concurrency instead of one at a
  // time so a re-import of an already-loaded file doesn't multiply latency.
  await mapWithConcurrency(toUpdate, 20, async ({ id, payload, rowNum }) => {
    const { error } = await supabase.from("accounts").update(payload).eq("id", id);
    if (error) errors.push(`Row ${rowNum}: ${error.message}`);
    else updated += 1;
  });

  await supabase.rpc("log_audit_event", {
    p_action: "accounts.imported", p_entity_type: "account", p_entity_id: null, p_metadata: { imported, updated },
  });

  return { error: errors.length ? errors.join("; ") : null, imported, updated };
}

export async function importContactsCsv(csvText: string) {
  const profile = await requireProfile();
  const supabase = createClient();
  const { rows, error: parseError } = csvToObjects(csvText);
  if (parseError) return { error: parseError, imported: 0, updated: 0 };

  const errors: string[] = [];
  const validRows = rows
    .map((row, i) => {
      // Accept common export aliases (e.g. ZoomInfo/Apollo-style exports use "Full Name",
      // "Job Title", "Phone Number" instead of our column names).
      let firstName = row.first_name || "";
      let lastName = row.last_name || "";
      if ((!firstName || !lastName) && (row.full_name || row.name)) {
        const parts = (row.full_name || row.name).trim().split(/\s+/);
        firstName = firstName || parts[0] || "";
        lastName = lastName || parts.slice(1).join(" ") || "";
      }
      return { row, i, firstName, lastName };
    })
    .filter(({ firstName, lastName, i }) => {
      if (!firstName || !lastName) errors.push(`Row ${i + 2}: missing first_name/last_name, skipped.`);
      return !!firstName && !!lastName;
    });

  // Resolve every distinct company name to an account id in one pass
  // (fetch-all + single bulk insert of the missing ones), instead of a
  // domain lookup + name lookup + possible insert per row.
  const companyNames = validRows.map(({ row }) => row.company_name || row.company || "").filter(Boolean);
  const accountIdByName = await resolveAccountIdsInBulk(supabase, profile.id, companyNames);

  // One bulk fetch of existing contacts' emails covers dedup for every row,
  // instead of an `ilike` round trip per row.
  const emails = validRows.map(({ row }) => row.email).filter(Boolean) as string[];
  const byEmail = new Map<string, string>();
  if (emails.length) {
    const { data: existing } = await supabase.from("contacts").select("id, email");
    for (const c of existing ?? []) {
      if (c.email) byEmail.set(String(c.email).trim().toLowerCase(), c.id);
    }
  }

  const toInsert: Record<string, unknown>[] = [];
  const toUpdate: { id: string; payload: Record<string, unknown>; rowNum: number }[] = [];

  for (const { row, i, firstName, lastName } of validRows) {
    const companyName = row.company_name || row.company || "";
    const accountId = row.account_id || (companyName ? accountIdByName.get(companyName.trim().toLowerCase()) ?? null : null);

    const payload = {
      first_name: firstName,
      last_name: lastName,
      title: row.title || row.job_title || null,
      email: row.email || null,
      phone: row.phone || row.phone_number || null,
      linkedin_url: row.linkedin_url || row.linkedin || null,
      status: pickEnum<ContactStatus>(row.status, CONTACT_STATUSES, "new"),
      priority: pickEnum<PriorityLevel>(row.priority, PRIORITIES, "medium"),
      notes: row.notes || null,
      account_id: accountId,
    };

    const existingId = row.id || (row.email && byEmail.get(row.email.trim().toLowerCase())) || null;

    if (existingId) toUpdate.push({ id: existingId, payload, rowNum: i + 2 });
    else toInsert.push({ ...payload, owner_id: profile.id, created_by: profile.id });
  }

  let imported = 0;
  let updated = 0;

  for (const batch of chunk(toInsert, 500)) {
    const { error } = await supabase.from("contacts").insert(batch);
    if (error) errors.push(`Insert batch: ${error.message}`);
    else imported += batch.length;
  }

  await mapWithConcurrency(toUpdate, 20, async ({ id, payload, rowNum }) => {
    const { error } = await supabase.from("contacts").update(payload).eq("id", id);
    if (error) errors.push(`Row ${rowNum}: ${error.message}`);
    else updated += 1;
  });

  await supabase.rpc("log_audit_event", {
    p_action: "contacts.imported", p_entity_type: "contact", p_entity_id: null, p_metadata: { imported, updated },
  });

  return { error: errors.length ? errors.join("; ") : null, imported, updated };
}