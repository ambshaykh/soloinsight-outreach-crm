import { createClient } from "@/lib/supabase/server";

export type SalesforceOutreachRow = {
  id: string;
  org_key: string;
  org_label: string;
  instance_url: string | null;
  stat_date: string;
  campaign_label: string;
  batches_sent: number | null;
  batches_blocked: number | null;
  emails_sent: number | null;
  emails_uploaded: number | null;
  delivery_rate: number | null;
  notes: string | null;
  data_source: "manual" | "n8n" | "spreadsheet_backfill";
};

export type OutreachMonthGroup = {
  monthKey: string; // e.g. '2026-06'
  monthLabel: string; // e.g. 'June 2026'
  rows: SalesforceOutreachRow[];
  totals: { batchesSent: number; batchesBlocked: number; emailsSent: number; emailsUploaded: number };
};

/** All per-org daily send-batch rows, grouped by calendar month, newest month first. */
export async function getSalesforceOutreachDetail(): Promise<OutreachMonthGroup[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("salesforce_outreach_daily_stats")
    .select("*")
    .order("stat_date", { ascending: true })
    .order("org_key", { ascending: true });

  const rows = (data as SalesforceOutreachRow[]) ?? [];
  const groups = new Map<string, OutreachMonthGroup>();

  for (const row of rows) {
    const d = new Date(row.stat_date);
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(monthKey)) {
      const monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
      groups.set(monthKey, { monthKey, monthLabel, rows: [], totals: { batchesSent: 0, batchesBlocked: 0, emailsSent: 0, emailsUploaded: 0 } });
    }
    const g = groups.get(monthKey)!;
    g.rows.push(row);
    g.totals.batchesSent += row.batches_sent ?? 0;
    g.totals.batchesBlocked += row.batches_blocked ?? 0;
    g.totals.emailsSent += row.emails_sent ?? 0;
    g.totals.emailsUploaded += row.emails_uploaded ?? 0;
  }

  return Array.from(groups.values()).sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}
