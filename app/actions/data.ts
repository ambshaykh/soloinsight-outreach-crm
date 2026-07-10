"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { AccountStatus, ContactStatus, PriorityLevel } from "@/lib/types/database";

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

/** Finds an existing account by domain or company name (case-insensitive), or creates one. */
async function resolveAccountId(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  companyName: string,
  domain?: string,
): Promise<string | null> {
  if (!companyName && !domain) return null;

  if (domain) {
    const { data } = await supabase.from("accounts").select("id").ilike("domain", domain).maybeSingle();
    if (data) return data.id;
  }
  if (companyName) {
    const { data } = await supabase.from("accounts").select("id").ilike("company_name", companyName).maybeSingle();
    if (data) return data.id;
  }
  if (!companyName) return null;

  const { data: created, error } = await supabase
    .from("accounts")
    .insert({
      company_name: companyName,
      domain: domain || null,
      status: "new",
      priority: "medium",
      icp_score: 50,
      owner_id: profileId,
      created_by: profileId,
    })
    .select("id")
    .single();
  return error ? null : created.id;
}

export async function importAccountsCsv(csvText: string) {
  const profile = await requireProfile();
  const supabase = createClient();
  const { rows, error: parseError } = csvToObjects(csvText);
  if (parseError) return { error: parseError, imported: 0, updated: 0 };

  let imported = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const companyName = row.company_name || row.company || "";
    if (!companyName) { errors.push(`Row ${i + 2}: missing company_name, skipped.`); continue; }

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

    let existingId: string | null = row.id || null;
    if (!existingId && row.domain) {
      const { data } = await supabase.from("accounts").select("id").ilike("domain", row.domain).maybeSingle();
      existingId = data?.id ?? null;
    }
    if (!existingId) {
      const { data } = await supabase.from("accounts").select("id").ilike("company_name", companyName).maybeSingle();
      existingId = data?.id ?? null;
    }

    if (existingId) {
      const { error } = await supabase.from("accounts").update(payload).eq("id", existingId);
      if (error) errors.push(`Row ${i + 2}: ${error.message}`);
      else updated += 1;
    } else {
      const { error } = await supabase.from("accounts").insert({ ...payload, owner_id: profile.id, created_by: profile.id });
      if (error) errors.push(`Row ${i + 2}: ${error.message}`);
      else imported += 1;
    }
  }

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

  let imported = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    // Accept common export aliases (e.g. ZoomInfo/Apollo-style exports use "Full Name",
    // "Job Title", "Phone Number" instead of our column names).
    let firstName = row.first_name || "";
    let lastName = row.last_name || "";
    if ((!firstName || !lastName) && (row.full_name || row.name)) {
      const parts = (row.full_name || row.name).trim().split(/\s+/);
      firstName = firstName || parts[0] || "";
      lastName = lastName || parts.slice(1).join(" ") || "";
    }
    if (!firstName || !lastName) { errors.push(`Row ${i + 2}: missing first_name/last_name, skipped.`); continue; }

    const companyName = row.company_name || row.company || "";
    const accountId = row.account_id || (companyName ? await resolveAccountId(supabase, profile.id, companyName) : null);

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

    let existingId: string | null = row.id || null;
    if (!existingId && row.email) {
      const { data } = await supabase.from("contacts").select("id").ilike("email", row.email).maybeSingle();
      existingId = data?.id ?? null;
    }

    if (existingId) {
      const { error } = await supabase.from("contacts").update(payload).eq("id", existingId);
      if (error) errors.push(`Row ${i + 2}: ${error.message}`);
      else updated += 1;
    } else {
      const { error } = await supabase.from("contacts").insert({ ...payload, owner_id: profile.id, created_by: profile.id });
      if (error) errors.push(`Row ${i + 2}: ${error.message}`);
      else imported += 1;
    }
  }

  await supabase.rpc("log_audit_event", {
    p_action: "contacts.imported", p_entity_type: "contact", p_entity_id: null, p_metadata: { imported, updated },
  });

  return { error: errors.length ? errors.join("; ") : null, imported, updated };
}