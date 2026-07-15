"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { exportAccountsCsv, exportContactsCsv } from "@/app/actions/data";
import { getAnalyticsData } from "@/lib/data/analytics";
import { listSalesforceCampaignStats } from "@/app/actions/salesforce";
import { REPORT_CATALOG, type ReportKey } from "@/lib/reports/catalog";

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => escape(r[c])).join(","))].join("\n");
}

export async function runReport(key: ReportKey): Promise<{ error: string | null; csv?: string; filename?: string; rowCount?: number }> {
  const profile = await requireProfile();
  if (!(await hasPermission("reports.view"))) {
    return { error: "You don't have permission to run reports." };
  }

  let csv = "";
  let rowCount = 0;
  const def = REPORT_CATALOG.find((r) => r.key === key);
  if (!def) return { error: "Unknown report." };

  switch (key) {
    case "pipeline_export": {
      csv = await exportAccountsCsv();
      rowCount = Math.max(0, csv.split("\n").length - 1);
      break;
    }
    case "contacts_export": {
      csv = await exportContactsCsv();
      rowCount = Math.max(0, csv.split("\n").length - 1);
      break;
    }
    case "team_activity_export": {
      const analytics = await getAnalyticsData();
      const columns = ["name", "role", "emails", "calls", "linkedin", "meetings", "total"];
      csv = toCsv(analytics.perUser, columns);
      rowCount = analytics.perUser.length;
      break;
    }
    case "salesforce_campaign_export": {
      const stats = await listSalesforceCampaignStats();
      const columns = ["org_id", "campaign_name", "campaign_status", "start_date", "leads_uploaded", "responded_count", "synced_at"];
      csv = toCsv(stats as any, columns);
      rowCount = stats.length;
      break;
    }
  }

  const supabase = createClient();
  await supabase.from("report_runs").insert({
    report_key: key, report_label: def.label, run_by: profile.id, row_count: rowCount, format: "csv",
  });

  return { error: null, csv, filename: `${key}.csv`, rowCount };
}

export async function listReportRunHistory(limit = 15) {
  await requireProfile();
  if (!(await hasPermission("reports.view"))) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("report_runs")
    .select("*, run_by_profile:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listReportRunHistory failed:", error.message);
    return [];
  }
  return data;
}
