"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OutreachMonthRow } from "@/lib/data/outreach-summary";

const METRIC_KEYS: (keyof OutreachMonthRow)[] = [
  "contact_target", "contacts_enriched", "contacts_executed", "contacts_delivered",
  "campaigns_executed", "campaign_days", "businesses_reached", "daily_campaign_avg",
  "success_rate", "bounce_rate", "optout_rate", "leads_mql", "leads_sql",
  "leads_in_progress", "leads_success_lt50", "leads_progress_pct",
  "campaign_to_lead_ratio", "outreach_to_lead_ratio",
  "primary_focus", "secondary_focus", "region_general", "region_particular",
];

function csvEscape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Same one-click CSV pattern as the main Executive Dashboard's export button — built client-side from the rows already on the page, no extra query. */
export function OutreachSummaryExportButton({ year, rows }: { year: number; rows: OutreachMonthRow[] }) {
  function exportCsv() {
    const header = ["Attribute/Description", ...rows.map((r) => r.period_label)];
    const lines = [header.join(",")];
    for (const key of METRIC_KEYS) {
      lines.push([csvEscape(key), ...rows.map((r) => csvEscape(r[key]))].join(","));
    }
    download(`outreach-summary-${year}.csv`, lines.join("\n"));
  }

  return (
    <Button size="sm" variant="secondary" onClick={exportCsv}>
      <Download className="h-4 w-4" /> Export {year} as CSV
    </Button>
  );
}
