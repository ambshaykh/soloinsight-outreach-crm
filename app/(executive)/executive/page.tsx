import { hasPermission } from "@/lib/auth/permissions";
import { getExecutiveDashboardLayout, getExecutiveDashboardData } from "@/app/actions/executive";
import { DashboardGrid } from "@/components/executive/dashboard-grid";
import { StatTile } from "@/components/shared/stat-tile";
import { MiniBarTrend } from "@/components/shared/mini-bar-trend";
import { Briefcase, Calendar, Flame, TrendingDown, MessageSquareReply } from "lucide-react";

export default async function ExecutivePortalHome() {
  const canEdit = await hasPermission("executive_dashboard.edit_layout");
  const [layout, data] = await Promise.all([getExecutiveDashboardLayout(), getExecutiveDashboardData()]);
  const { kpis, activityTrend } = data;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F1419]">Executive Dashboard</h1>
          <p className="text-sm text-[#6B7280]">
            {canEdit
              ? "Drag the grip handle to reorder widgets, or use the size dropdown to resize them — your layout saves automatically."
              : "A leadership rollup of pipeline, team activity, and Salesforce campaign data."}
          </p>
        </div>
        <div className="hidden w-40 shrink-0 sm:block">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#8B95A5]">Outreach · 14 days</p>
          <MiniBarTrend data={activityTrend} height={36} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Briefcase} label="In progress" value={kpis.accountsInProgress} tone="primary" />
        <StatTile icon={Calendar} label="Meetings booked" value={kpis.meetingsBooked} tone="success" />
        <StatTile icon={Flame} label="Hot prospects" value={kpis.hotProspects} tone="warning" />
        <StatTile icon={MessageSquareReply} label="Reply rate" value={`${kpis.replyRate}%`} tone="primary" />
        <StatTile icon={TrendingDown} label="Stale (14d+)" value={kpis.staleProspects} tone={kpis.staleProspects > 0 ? "danger" : "neutral"} />
        <StatTile
          label="Outreach · 7d"
          value={kpis.last7DayActivity}
          delta={kpis.activityDelta ?? undefined}
          deltaLabel="%"
          sublabel="vs prior 7 days"
          tone="neutral"
        />
      </div>

      <DashboardGrid initialLayout={layout} data={data} canEdit={canEdit} />
    </div>
  );
}
