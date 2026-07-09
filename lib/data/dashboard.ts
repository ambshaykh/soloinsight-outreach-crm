import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export async function getDashboardData(profile: Profile) {
  const supabase = createClient();
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

  const [accountsRes, contactsRes, activitiesRes, tasksRes, profilesRes] = await Promise.all([
    supabase.from("accounts").select("*"),
    supabase.from("contacts").select("*, account:accounts(company_name)"),
    supabase.from("activities").select("*").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("tasks").select("*, contact:contacts(first_name, last_name, account:accounts(company_name))"),
    supabase.from("profiles").select("id, full_name, avatar_url, role"),
  ]);

  const accounts = accountsRes.data ?? [];
  const contacts = contactsRes.data ?? [];
  const activities = activitiesRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  const emailsToday = activities.filter(
    (a) => a.activity_type === "email" && new Date(a.created_at) >= startOfToday
  ).length;
  const callsToday = activities.filter(
    (a) => a.activity_type === "call" && new Date(a.created_at) >= startOfToday
  ).length;

  const followUpsDueToday = tasks.filter((t) => {
    const due = new Date(t.due_date);
    return t.status === "open" && due >= startOfToday && due < new Date(startOfToday.getTime() + 86400000);
  }).length;

  const meetingsBooked = activities.filter((a) => a.activity_type === "meeting").length +
    contacts.filter((c) => c.status === "meeting_booked").length;

  const hotProspects = contacts.filter((c) => c.priority === "urgent" || c.status === "positive_reply").length;

  const staleProspects = contacts.filter((c) => {
    if (!c.last_contacted_at) return true;
    const days = (Date.now() - new Date(c.last_contacted_at).getTime()) / 86400000;
    return days >= 14 && !["closed", "not_interested"].includes(c.status);
  }).length;

  const accountsInProgress = accounts.filter((a) =>
    ["in_progress", "engaged", "assigned"].includes(a.status)
  ).length;

  // Daily outreach activity — last 14 days, email vs call
  const dailyActivity: { date: string; email: number; call: number; linkedin: number; other: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now); day.setDate(now.getDate() - i); day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day.getTime() + 86400000);
    const dayActivities = activities.filter((a) => {
      const t = new Date(a.created_at);
      return t >= day && t < nextDay;
    });
    dailyActivity.push({
      date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      email: dayActivities.filter((a) => a.activity_type === "email").length,
      call: dayActivities.filter((a) => a.activity_type === "call").length,
      linkedin: dayActivities.filter((a) => a.activity_type === "linkedin").length,
      other: dayActivities.filter((a) => !["email", "call", "linkedin"].includes(a.activity_type)).length,
    });
  }

  const emailVsCall = [
    { name: "Email", value: activities.filter((a) => a.activity_type === "email").length },
    { name: "Call", value: activities.filter((a) => a.activity_type === "call").length },
    { name: "LinkedIn", value: activities.filter((a) => a.activity_type === "linkedin").length },
    { name: "Other", value: activities.filter((a) => !["email", "call", "linkedin"].includes(a.activity_type)).length },
  ];

  const pipelineByStatus = Object.entries(
    accounts.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const ownerPerformance = profiles
    .filter((p) => p.role === "sdr" || p.role === "manager")
    .map((p) => {
      const ownedContacts = contacts.filter((c) => c.owner_id === p.id);
      const ownedActivities = activities.filter((a) => a.created_by === p.id);
      return {
        name: p.full_name,
        emails: ownedActivities.filter((a) => a.activity_type === "email").length,
        calls: ownedActivities.filter((a) => a.activity_type === "call").length,
        contacts: ownedContacts.length,
      };
    });

  const todaysFollowUps = tasks
    .filter((t) => {
      const due = new Date(t.due_date);
      return t.status === "open" && due < new Date(startOfToday.getTime() + 86400000);
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 8);

  const recentlyTouched = [...contacts]
    .filter((c) => c.last_contacted_at)
    .sort((a, b) => new Date(b.last_contacted_at!).getTime() - new Date(a.last_contacted_at!).getTime())
    .slice(0, 8);

  const needsAttention = [...contacts]
    .filter((c) => {
      const days = c.last_contacted_at
        ? (Date.now() - new Date(c.last_contacted_at).getTime()) / 86400000
        : 999;
      return days >= 7 && !["closed", "not_interested"].includes(c.status);
    })
    .sort((a, b) => {
      const da = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0;
      const db = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0;
      return da - db;
    })
    .slice(0, 8);

  return {
    metrics: {
      totalProspects: contacts.length,
      accountsInProgress,
      emailsToday,
      callsToday,
      followUpsDueToday,
      meetingsBooked,
      hotProspects,
      staleProspects,
    },
    charts: { dailyActivity, emailVsCall, pipelineByStatus, ownerPerformance },
    widgets: { todaysFollowUps, recentlyTouched, needsAttention },
  };
}
