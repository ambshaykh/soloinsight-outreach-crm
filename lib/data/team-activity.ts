import { listActivities } from "@/lib/data/activities";

/**
 * Phase 12 — Admin portal Team Activity dashboard.
 *
 * Deliberately reads ONLY the `activities` table. Unlike the Executive
 * Dashboard's Outreach Summary (outreach_monthly_summary), which blends
 * manual logging with Salesforce campaign stats, `activities` is exclusively
 * populated by manual logging in the Sales portal (log-activity-modal.tsx /
 * app/actions/activities.ts) — Salesforce data lives in its own tables
 * (salesforce_campaign_stats, salesforce_outreach_daily_stats) and never
 * writes here. So this view is "manual outreach only" with no extra
 * filtering logic needed to exclude anything.
 */
export async function getTeamActivityFeed(limit = 500) {
  return listActivities({ limit });
}
