import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export async function getQueueData(profile: Profile, scope: "mine" | "team") {
  const supabase = createClient();
  let query = supabase
    .from("contacts")
    .select(
      `*, account:accounts(id, company_name), owner:profiles!contacts_owner_id_fkey(id, full_name, avatar_url)`
    )
    .not("status", "in", '("closed","not_interested")');

  if (scope === "mine") query = query.eq("owner_id", profile.id);

  const { data: contacts, error } = await query;
  if (error) throw error;
  const rows = contacts ?? [];

  const contactIds = rows.map((c) => c.id);
  const { data: activities } = await supabase
    .from("activities")
    .select("contact_id, activity_type, created_at")
    .in("contact_id", contactIds.length ? contactIds : ["00000000-0000-0000-0000-000000000000"]);

  const activityMap = new Map<string, { email: number; call: number; latest: string | null }>();
  (activities ?? []).forEach((a) => {
    if (!a.contact_id) return;
    const entry = activityMap.get(a.contact_id) ?? { email: 0, call: 0, latest: null };
    if (a.activity_type === "email") entry.email += 1;
    if (a.activity_type === "call") entry.call += 1;
    if (!entry.latest || new Date(a.created_at) > new Date(entry.latest)) entry.latest = a.created_at;
    activityMap.set(a.contact_id, entry);
  });

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 86400000);

  const enriched = rows.map((c) => {
    const touch = activityMap.get(c.id) ?? { email: 0, call: 0, latest: null };
    const daysSinceTouch = c.last_contacted_at
      ? Math.floor((now.getTime() - new Date(c.last_contacted_at).getTime()) / 86400000)
      : null;
    return { ...c, emailTouches: touch.email, callTouches: touch.call, daysSinceTouch };
  });

  const dueToday = enriched.filter(
    (c) => c.next_follow_up_at && new Date(c.next_follow_up_at) >= startOfToday && new Date(c.next_follow_up_at) < endOfToday
  );
  const overdue = enriched.filter((c) => c.next_follow_up_at && new Date(c.next_follow_up_at) < startOfToday);
  const hot = enriched.filter((c) => c.priority === "urgent" || c.status === "positive_reply");
  const noTouch7 = enriched.filter((c) => c.daysSinceTouch !== null && c.daysSinceTouch >= 7 && c.daysSinceTouch < 14);
  const noTouch14 = enriched.filter((c) => c.daysSinceTouch === null || c.daysSinceTouch >= 14);
  const callNoEmail = enriched.filter((c) => c.callTouches > 0 && c.emailTouches === 0);
  const emailNoCall = enriched.filter((c) => c.emailTouches > 0 && c.callTouches === 0);
  const readyForSecondTouch = enriched.filter((c) => c.emailTouches + c.callTouches === 1);
  const readyForFinalTouch = enriched.filter((c) => c.emailTouches + c.callTouches >= 3);

  const kanban = enriched;

  return {
    all: enriched,
    dueToday, overdue, hot, noTouch7, noTouch14,
    callNoEmail, emailNoCall, readyForSecondTouch, readyForFinalTouch,
    kanban,
  };
}
