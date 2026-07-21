import { cn } from "@/lib/utils";
import type { OutreachMonthRow } from "@/lib/data/outreach-summary";

type MetricKind = "count" | "decimal" | "rate";

const NUMBERED_METRICS: { key: keyof OutreachMonthRow; label: string; kind: MetricKind }[] = [
  { key: "contact_target", label: "Total Contact Target", kind: "count" },
  { key: "contacts_enriched", label: "Total Contacts Enriched", kind: "count" },
  { key: "contacts_executed", label: "Total Contacts Executed (Sent)", kind: "count" },
  { key: "contacts_delivered", label: "Total Contacts Delivered (Email Open)", kind: "count" },
  { key: "campaigns_executed", label: "Total Campaigns Executed", kind: "count" },
  { key: "campaign_days", label: "Total Campaign Days", kind: "count" },
  { key: "businesses_reached", label: "Total Businesses Reached", kind: "count" },
  { key: "daily_campaign_avg", label: "Total Daily Campaign (Average)", kind: "decimal" },
  { key: "success_rate", label: "Campaign Success (Average Open Rate)", kind: "rate" },
  { key: "bounce_rate", label: "Campaign Bounce Rate (Average)", kind: "rate" },
  { key: "optout_rate", label: "Campaign Opt-out Rate (Average)", kind: "rate" },
  { key: "leads_mql", label: "Total Leads Generated (MQL)", kind: "count" },
  { key: "leads_sql", label: "Leads Established (SQL/Meetings)", kind: "count" },
  { key: "leads_in_progress", label: "Leads In-Progress (MQL/SQL)", kind: "count" },
  { key: "leads_success_lt50", label: "Total Leads With Success <50%", kind: "count" },
  { key: "leads_progress_pct", label: "Overall Leads Progress (Success)", kind: "rate" },
  { key: "campaign_to_lead_ratio", label: "Campaign to Lead Conversion Ratio", kind: "rate" },
  { key: "outreach_to_lead_ratio", label: "Business Outreach to Lead Ratio", kind: "rate" },
];

const QUALITATIVE_ROWS: { key: keyof OutreachMonthRow; label: string }[] = [
  { key: "primary_focus", label: "Primary Campaign Focus" },
  { key: "secondary_focus", label: "Secondary Campaign Focus" },
  { key: "region_general", label: "Campaign Region (In General)" },
  { key: "region_particular", label: "Campaign Region (In Particular)" },
];

function fmtCount(v: number | null) {
  return v === null || v === undefined ? "—" : v.toLocaleString();
}
function fmtRate(v: number | null) {
  return v === null || v === undefined ? "—" : `${v.toFixed(2)}%`;
}
function fmtDecimal(v: number | null) {
  return v === null || v === undefined ? "—" : v.toFixed(1);
}
function fmt(v: number | null, kind: MetricKind) {
  if (kind === "count") return fmtCount(v);
  if (kind === "rate") return fmtRate(v);
  return fmtDecimal(v);
}

function yearTotal(rows: OutreachMonthRow[], key: keyof OutreachMonthRow, kind: MetricKind): number | null {
  const values = rows.map((r) => r[key]).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  if (kind === "count") return values.reduce((a, b) => a + b, 0);
  // decimal/rate rows are rolled up as a simple average of the months shown,
  // matching how the source spreadsheet's own "Overall" column behaves for
  // rate-type rows (its target/enriched/etc. columns sum; its rate columns average).
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

/**
 * Renders one year's worth of the Outreach Summary in the same shape as the
 * "Outreach Summary (2)" sheet: a merged-look title banner over the month
 * columns, numbered KPI rows (1–18), a dashed-row block of qualitative
 * context underneath, a year-total column, and a footer band. Wrapped in
 * the existing <Table> primitive so it inherits the app's scroll/border
 * treatment for wide tables.
 */
export function OutreachSummaryTable({ year, rows }: { year: number; rows: OutreachMonthRow[] }) {
  const hasPartialData = rows.some((r) => r.data_source === "derived_partial");

  return (
    <div className="w-full overflow-auto rounded-xl border border-violet-200">
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr>
            <th colSpan={2} className="bg-gradient-to-r from-violet-700 to-fuchsia-700 px-4 py-3" />
            <th
              colSpan={rows.length}
              className="bg-gradient-to-r from-violet-700 to-fuchsia-700 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white"
            >
              Executive Summary (Soloinsight Campaign Outreach)
            </th>
            <th className="bg-violet-900 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white">
              {year} Total
            </th>
          </tr>
          <tr className="bg-violet-50">
            <th className="w-10 px-3 py-2 text-left text-xs font-semibold text-violet-800">No.</th>
            <th className="min-w-[220px] px-3 py-2 text-left text-xs font-semibold text-violet-800">Attribute / Description</th>
            {rows.map((r) => (
              <th key={r.period_month} className="whitespace-nowrap px-3 py-2 text-center text-xs font-semibold text-violet-800">
                <span className="flex items-center justify-center gap-1">
                  {r.period_label}
                  {r.data_source === "derived_partial" && (
                    <span
                      title="Derived from the daily log for this month — the master rollup hasn't caught up yet, so a few rows here aren't available."
                      className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700"
                    >
                      partial
                    </span>
                  )}
                </span>
              </th>
            ))}
            <th className="whitespace-nowrap px-3 py-2 text-center text-xs font-semibold text-violet-900">Overall</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-violet-100">
          {NUMBERED_METRICS.map((m, i) => (
            <tr key={m.key} className={cn(i % 2 === 1 && "bg-violet-50/40")}>
              <td className="px-3 py-2 text-xs font-medium text-violet-500">{i + 1}</td>
              <td className="px-3 py-2 text-sm font-medium text-[#0F1419]">{m.label}</td>
              {rows.map((r) => (
                <td key={r.period_month} className="whitespace-nowrap px-3 py-2 text-center text-sm text-[#0F1419]">
                  {fmt(r[m.key] as number | null, m.kind)}
                </td>
              ))}
              <td className="whitespace-nowrap px-3 py-2 text-center text-sm font-semibold text-violet-800">
                {fmt(yearTotal(rows, m.key, m.kind), m.kind)}
              </td>
            </tr>
          ))}

          {/* Spacer row, matching the blank row the spreadsheet uses to separate
              hard numbers from qualitative context. */}
          <tr>
            <td colSpan={rows.length + 3} className="h-3 bg-white" />
          </tr>

          {QUALITATIVE_ROWS.map((q) => (
            <tr key={q.key}>
              <td className="px-3 py-2 text-xs font-medium text-violet-400">–</td>
              <td className="px-3 py-2 text-sm font-medium text-[#0F1419]">{q.label}</td>
              {rows.map((r) => (
                <td key={r.period_month} className="max-w-[220px] px-3 py-2 text-center text-xs text-[#6B7280]">
                  {(r[q.key] as string | null) ?? "—"}
                </td>
              ))}
              <td className="px-3 py-2 text-center text-xs text-[#8B95A5]">—</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={rows.length + 3} className="bg-violet-900 px-4 py-2 text-center text-[11px] font-medium text-violet-200">
              © Soloinsight Inc. — Internal Executive Data — Confidential
              {hasPartialData && " · Months marked \"partial\" are derived from daily logs, not the fully-reconciled monthly rollup."}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
