import { createClient } from "@/lib/supabase/server";

export type OutreachMonthRow = {
  id: string;
  period_month: string;
  period_label: string;
  contact_target: number | null;
  contacts_enriched: number | null;
  contacts_executed: number | null;
  contacts_delivered: number | null;
  campaigns_executed: number | null;
  campaign_days: number | null;
  businesses_reached: number | null;
  daily_campaign_avg: number | null;
  success_rate: number | null;
  bounce_rate: number | null;
  optout_rate: number | null;
  leads_mql: number | null;
  leads_sql: number | null;
  leads_in_progress: number | null;
  leads_success_lt50: number | null;
  leads_progress_pct: number | null;
  campaign_to_lead_ratio: number | null;
  outreach_to_lead_ratio: number | null;
  primary_focus: string | null;
  secondary_focus: string | null;
  region_general: string | null;
  region_particular: string | null;
  data_source: "manual" | "n8n" | "spreadsheet_backfill" | "derived_partial";
};

/** Every distinct calendar year that has at least one row, oldest first. */
export async function getOutreachSummaryYears(): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("outreach_monthly_summary")
    .select("period_month")
    .order("period_month");
  const years = new Set<number>();
  for (const r of data ?? []) years.add(new Date(r.period_month as string).getUTCFullYear());
  return Array.from(years).sort((a, b) => a - b);
}

/** All months in a given calendar year, oldest first. */
export async function getOutreachSummaryForYear(year: number): Promise<OutreachMonthRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("outreach_monthly_summary")
    .select("*")
    .gte("period_month", `${year}-01-01`)
    .lte("period_month", `${year}-12-31`)
    .order("period_month");
  return (data as OutreachMonthRow[]) ?? [];
}
