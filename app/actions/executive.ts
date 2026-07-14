"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getDashboardData } from "@/lib/data/dashboard";
import { getAnalyticsData } from "@/lib/data/analytics";
import { getTopPriorityItems } from "@/lib/data/executive";
import { listSalesforceCampaignStats } from "@/app/actions/salesforce";
import { DEFAULT_LAYOUT, type LayoutItem } from "@/lib/executive/layout-config";

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
  return data.layout as LayoutItem[];
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

/** All four widgets' data, fetched together for a single page load. */
export async function getExecutiveDashboardData() {
  const profile = await requireProfile();

  const [dashboard, analytics, topPriority, salesforceStats] = await Promise.all([
    getDashboardData(profile),
    getAnalyticsData(),
    getTopPriorityItems(8),
    listSalesforceCampaignStats(),
  ]);

  const salesforceSummary = {
    totalLeads: salesforceStats.reduce((sum: number, s: any) => sum + (s.leads_uploaded ?? 0), 0),
    campaignsSynced: salesforceStats.length,
    totalResponses: salesforceStats.reduce((sum: number, s: any) => sum + (s.responded_count ?? 0), 0),
  };

  return {
    pipeline: dashboard.charts.pipelineByStatus,
    teamActivity: analytics.perUser,
    topPriority,
    salesforceSummary,
  };
}
