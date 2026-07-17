"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getDashboardData } from "@/lib/data/dashboard";
import { getAnalyticsData } from "@/lib/data/analytics";
import { getTopPriorityItems, getTeamLeaderboard } from "@/lib/data/executive";
import { listSalesforceCampaignStats } from "@/app/actions/salesforce";
import { DEFAULT_LAYOUT, type LayoutItem, type WidgetId } from "@/lib/executive/layout-config";

export async function getExecutiveDashboardLayout(): Promise<LayoutItem[]> {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("executive_dashboard_layouts")
    .select("layout")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error) {
    console.error("getExecutiveDashboardLayout failed:", error.message);
    return DEFAULT_LAYOUT;
  }
  if (!data || !Array.isArray(data.layout) || data.layout.length === 0) {
    return DEFAULT_LAYOUT;
  }

  // Phase 7 added a new widget (pipeline_forecast). Anyone with a
  // previously-saved layout (from before this widget existed) wouldn't see
  // it just because their saved layout array doesn't mention it — so append
  // any DEFAULT_LAYOUT widgets missing from the saved layout, keeping the
  // user's existing order/sizes for everything else untouched.
  const saved = data.layout as LayoutItem[];
  const savedIds = new Set(saved.map((w) => w.id));
  const missing = DEFAULT_LAYOUT.filter((w) => !savedIds.has(w.id));
  return missing.length > 0 ? [...saved, ...missing] : saved;
}

export async function saveExecutiveDashboardLayout(layout: LayoutItem[]) {
  const profile = await requireProfile();
  if (!(await hasPermission("executive_dashboard.edit_layout"))) {
    return { error: "You don't have permission to edit this dashboard's layout." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("executive_dashboard_layouts")
    .upsert({ profile_id: profile.id, layout, updated_at: new Date().toISOString() }, { onConflict: "profile_id" });

  if (error) return { error: error.message };
  revalidatePath("/executive");
  return { error: null };
}

/** All widgets' data, fetched together for a single page load. */
export async function getExecutiveDashboardData() {
  const profile = await requireProfile();

  const [dashboard, analytics, topPriority, salesforceStats, leaderboard] = await Promise.all([
    getDashboardData(profile),
    getAnalyticsData(),
    getTopPriorityItems(8),
    listSalesforceCampaignStats(),
    getTeamLeaderboard(),
  ]);

  const salesforceSummary = {
    totalLeads: salesforceStats.reduce((sum: number, s: any) => sum + (s.leads_uploaded ?? 0), 0),
    campaignsSynced: salesforceStats.length,
    totalResponses: salesforceStats.reduce((sum: number, s: any) => sum + (s.responded_count ?? 0), 0),
  };

  // Real week-over-week delta on outreach volume, computed from the same
  // 30-day daily series Analytics already builds — no extra query needed,
  // and no invented numbers.
  const last7 = analytics.activityByDay.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const prior7 = analytics.activityByDay.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
  const activityDelta = prior7 > 0 ? Math.round(((last7 - prior7) / prior7) * 100) : null;

  const kpis = {
    totalProspects: dashboard.metrics.totalProspects,
    accountsInProgress: dashboard.metrics.accountsInProgress,
    meetingsBooked: dashboard.metrics.meetingsBooked,
    hotProspects: dashboard.metrics.hotProspects,
    staleProspects: dashboard.metrics.staleProspects,
    replyRate: analytics.summary.replyRate,
    last7DayActivity: last7,
    activityDelta,
  };

  const topReps = analytics.perUser.slice(0, 3);
  const activityTrend = analytics.activityByDay.slice(-14).map((d) => ({ value: d.count }));

  return {
    kpis,
    activityTrend,
    topReps,
    pipeline: dashboard.charts.pipelineByStatus,
    pipelineByWeek: analytics.pipelineByWeek,
    teamActivity: leaderboard,
    topPriority,
    salesforceSummary,
  };
}
