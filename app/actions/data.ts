"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function exportAccountsCsv() {
  await requireProfile();
  const supabase = createClient();
  const { data } = await supabase.from("accounts").select("company_name, domain, industry, region, company_size, source, status, priority, icp_score, last_touched_at, next_follow_up_at");
  return toCsv(data ?? []);
}

export async function exportContactsCsv() {
  await requireProfile();
  const supabase = createClient();
  const { data } = await supabase.from("contacts").select("first_name, last_name, title, email, phone, linkedin_url, status, priority, last_contacted_at, next_follow_up_at");
  return toCsv(data ?? []);
}

export async function importContactsCsv(csvText: string) {
  const profile = await requireProfile();
  const supabase = createClient();
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { error: "CSV has no data rows.", imported: 0 };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  let imported = 0;
  const errors: string[] = [];

  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    if (!row.first_name || !row.last_name) { errors.push(`Skipped row: ${line}`); continue; }

    const { error } = await supabase.from("contacts").insert({
      first_name: row.first_name,
      last_name: row.last_name,
      title: row.title || null,
      email: row.email || null,
      phone: row.phone || null,
      owner_id: profile.id,
      created_by: profile.id,
    });
    if (error) errors.push(error.message);
    else imported += 1;
  }

  await supabase.rpc("log_audit_event", {
    p_action: "contacts.imported", p_entity_type: "contact", p_entity_id: null, p_metadata: { imported },
  });

  return { error: errors.length ? errors.join("; ") : null, imported };
}
