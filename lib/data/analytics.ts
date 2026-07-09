import { createClient } from "@/lib/supabase/server";

export async function getAnalyticsData() {
  const supabase = createClient();
  const now = new Date();
  const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(now.getDate() - 60);

  const [activitiesRes, contactsRes, tasksRes, profilesRes] = await Promise.all([
    supabase.from("activities").select("*").gte("created_at", sixtyDaysAgo.toISOString()),
    supabase.from("contacts").select("*"),
    supabase.from("tasks").select("*"),
    supabase.from("profiles").select("id, full_name, role"),
  ]);

  const activities = activitiesRes.data ?? [];
  const contacts = contactsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  const totalActivities = activities.length;
  const emailCount = activities.filter((a) => a.activity_type === "email").length;
  const callCount = activities.filter((a) => a.activity_type === "call").length;
  const positiveReplies = activities.filter((a) => (a.outcome ?? "").toLowerCase().includes("positive")).length;
  const replyRate = emailCount > 0 ? Math.round((positiveReplies / emailCount) * 1000) / 10 : 0;
  const touchesPerProspect = contacts.length > 0 ? Math.round((totalActivities / contacts.length) * 10) / 10 : 0;
  const completedFollowUps = tasks.filter((t) => t.status === "completed").length;
  const meetingsBooked = activities.filter((a) => a.activity_type === "meeting").length;

  const staleProspects = contacts.filter((c) => {
    const days = c.last_contacted_at ? (Date.now() - new Date(c.last_contacted_at).getTime()) / 86400000 : 999;
    return days >= 14 && !["closed", "not_interested"].includes(c.status);
  }).length;

  const perUser = profiles
    .filter((p) => p.role !== "admin" || activities.some((a) => a.created_by === p.id))
    .map((p) => {
      const userActivities = activities.filter((a) => a.created_by === p.id);
      return {
        id: p.id,
        name: p.full_name,
        role: p.role,
        emails: userActivities.filter((a) => a.activity_type === "email").length,
        calls: userActivities.filter((a) => a.activity_type === "call").length,
        linkedin: userActivities.filter((a) => a.activity_type === "linkedin").length,
        meetings: userActivities.filter((a) => a.activity_type === "meeting").length,
        total: userActivities.length,
      };
    })
    .sort((a, b) => b.total - a.total);

  const activityByDay: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now); day.setDate(now.getDate() - i); day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day.getTime() + 86400000);
    activityByDay.push({
      date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: activities.filter((a) => {
        const t = new Date(a.created_at);
        return t >= day && t < nextDay;
      }).length,
    });
  }

  const activityByChannel = ["email", "call", "linkedin", "note", "meeting"].map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: activities.filter((a) => a.activity_type === type).length,
  }));

  const pipelineByWeek: { week: string; new: number; engaged: number; closed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - i * 7 - 6);
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - i * 7);
    pipelineByWeek.push({
      week: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      new: contacts.filter((c) => {
        const t = new Date(c.created_at);
        return t >= weekStart && t < weekEnd && c.status === "new";
      }).length,
      engaged: contacts.filter((c) => {
        const t = new Date(c.updated_at);
        return t >= weekStart && t < weekEnd && ["called", "first_touch_sent", "follow_up_needed", "positive_reply"].includes(c.status);
      }).length,
      closed: contacts.filter((c) => {
        const t = new Date(c.updated_at);
        return t >= weekStart && t < weekEnd && ["closed", "not_interested"].includes(c.status);
      }).length,
    });
  }

  return {
    summary: {
      totalActivities, emailCount, callCount, replyRate, touchesPerProspect,
      completedFollowUps, meetingsBooked, staleProspects,
    },
    perUser,
    activityByDay,
    activityByChannel,
    pipelineByWeek,
  };
}
