import { createClient } from "@/lib/supabase/server";

export interface BounceFilters {
  search?: string;
  bounceType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export async function listBounces(filters: BounceFilters = {}) {
  const supabase = createClient();
  let query = supabase
    .from("email_bounces")
    .select(
      `id, email, bounce_type, reason, campaign_label, bounced_at,
      contact:contacts(id, first_name, last_name),
      account:accounts(id, company_name)`
    )
    .order("bounced_at", { ascending: false })
    .limit(filters.limit ?? 500);

  if (filters.bounceType) query = query.eq("bounce_type", filters.bounceType);
  if (filters.dateFrom) query = query.gte("bounced_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("bounced_at", filters.dateTo);
  if (filters.search) query = query.ilike("email", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) {
    console.error("listBounces failed:", error.message);
    return [];
  }
  return data;
}

/**
 * Lightweight summary for the dashboard widget — today/week/month counts,
 * a 30-day hard/soft split, and a 14-day trend for the mini sparkline.
 * Bounces are low-volume compared to accounts/contacts, so this just
 * aggregates the same capped recent-events list the full page uses rather
 * than running a separate SQL aggregation query.
 */
export async function getBounceWidgetSummary() {
  const rows = await listBounces({ limit: 1000 });
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayCount = rows.filter((r) => new Date(r.bounced_at) >= startOfToday).length;
  const weekCount = rows.filter((r) => now - new Date(r.bounced_at).getTime() < 7 * 86400000).length;
  const monthCount = rows.filter((r) => now - new Date(r.bounced_at).getTime() < 30 * 86400000).length;
  const hardCount30d = rows.filter(
    (r) => r.bounce_type === "hard" && now - new Date(r.bounced_at).getTime() < 30 * 86400000
  ).length;
  const softCount30d = rows.filter(
    (r) => r.bounce_type === "soft" && now - new Date(r.bounced_at).getTime() < 30 * 86400000
  ).length;

  const trend: { value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day.getTime() + 86400000);
    trend.push({
      value: rows.filter((r) => {
        const t = new Date(r.bounced_at);
        return t >= day && t < nextDay;
      }).length,
    });
  }

  return { todayCount, weekCount, monthCount, hardCount30d, softCount30d, trend };
}
