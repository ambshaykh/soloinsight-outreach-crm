import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";

export async function listMyNotifications(limit = 20) {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listMyNotifications failed:", error.message);
    return [];
  }
  return data;
}

export async function countMyUnreadNotifications() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", profile.id)
    .is("read_at", null);
  if (error) {
    console.error("countMyUnreadNotifications failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

/** All template rows, grouped by event_key, for the Admin Center's Notifications & Templates page. */
export async function listNotificationTemplates() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .select("*, updated_by_profile:profiles(full_name)")
    .order("event_key");
  if (error) {
    console.error("listNotificationTemplates failed:", error.message);
    return [];
  }
  return data;
}
