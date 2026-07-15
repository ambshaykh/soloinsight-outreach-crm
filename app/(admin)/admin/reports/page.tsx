import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listReportRunHistory } from "@/app/actions/reports";
import { REPORT_CATALOG } from "@/lib/reports/catalog";
import { PageTransition } from "@/components/shared/page-transition";
import { PermissionDeniedState } from "@/components/shared/state-patterns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/shared/stat-tile";
import { ReportCatalog } from "@/components/settings/report-catalog";
import { FileBarChart, Clock, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function ReportsPage() {
  await requireProfile();
  const canView = await hasPermission("reports.view");

  if (!canView) {
    return (
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0F1419]">Reports &amp; Analytics</h1>
        </div>
        <PermissionDeniedState />
      </PageTransition>
    );
  }

  const runHistory = await listReportRunHistory(15);
  const runsLast7d = runHistory.filter((r: any) => Date.now() - new Date(r.created_at).getTime() < 7 * 86400000).length;

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Reports &amp; Analytics</h1>
        <p className="text-sm text-[#6B7280]">Pre-built exports, run on demand. Every run downloads a CSV and lands in the history below.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile icon={FileBarChart} label="Reports available" value={REPORT_CATALOG.length} sublabel={`${new Set(REPORT_CATALOG.map((r) => r.domain)).size} domains · CSV only`} tone="primary" />
        <StatTile icon={Clock} label="Runs · last 7 days" value={runsLast7d} tone="neutral" />
        <StatTile icon={Download} label="Total runs logged" value={runHistory.length} sublabel="most recent 15 shown below" tone="neutral" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report catalog</CardTitle>
          <CardDescription>Click Run to generate and download a CSV immediately. On-demand only for now — no scheduling yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportCatalog reports={REPORT_CATALOG} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent run history</CardTitle>
          <CardDescription>Last 15 runs across all reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {runHistory.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#6B7280]">No reports have been run yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-[#8B95A5]">
                    <th className="py-2 pr-4">Report</th>
                    <th className="py-2 pr-4">Run by</th>
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Rows</th>
                    <th className="py-2">Format</th>
                  </tr>
                </thead>
                <tbody>
                  {runHistory.map((r: any) => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 font-medium text-[#0F1419]">{r.report_label}</td>
                      <td className="py-2 pr-4 text-[#6B7280]">{r.run_by_profile?.full_name ?? "—"}</td>
                      <td className="py-2 pr-4 text-[#6B7280]">{formatDateTime(r.created_at)}</td>
                      <td className="py-2 pr-4 text-[#6B7280]">{r.row_count.toLocaleString()}</td>
                      <td className="py-2 uppercase text-[#8B95A5]">{r.format}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
