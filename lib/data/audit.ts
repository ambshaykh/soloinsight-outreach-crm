import { createClient } from "@/lib/supabase/server";

/**
 * Audit log reads for the Admin Center's Audit Log page. Filtering happens
 * client-side over this window — for a small internal sales team's volume
 * of admin/security events, fetching the most recent 500 and filtering in
 * the browser is simpler and plenty fast. If this team's audit volume ever
 * grows enough to need real server-side pagination, that's a straightforward
 * follow-up (swap this for range()-based paging keyed off the same filters).
 */
export async function listAuditLogsForReview(limit = 500) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, user:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listAuditLogsForReview failed:", error.message, error.details, error.hint);
    return [];
  }
  return data;
}
