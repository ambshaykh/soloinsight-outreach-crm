import { createClient } from "@/lib/supabase/server";

/** Top-priority accounts and contacts, for the executive dashboard's priority widget. */
export async function getTopPriorityItems(limit = 8) {
  const supabase = createClient();

  const [accountsRes, contactsRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, company_name, status, priority")
      .in("priority", ["high", "urgent"])
      .order("priority", { ascending: false })
      .limit(limit),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, status, priority, account:accounts(company_name)")
      .in("priority", ["high", "urgent"])
      .order("priority", { ascending: false })
      .limit(limit),
  ]);

  return {
    accounts: accountsRes.data ?? [],
    contacts: contactsRes.data ?? [],
  };
}

export type ExecutiveRecordFilter = "in_progress" | "hot" | "stale";

/**
 * Phase 7 — drill-down support for the Executive Dashboard's KPI tiles.
 * Mirrors the exact filter logic used to compute the KPI numbers in
 * lib/data/dashboard.ts, so what you see here always matches the tile you
 * clicked. Only wired up for KPIs that map to a single, clean record set —
 * "Meetings booked" and "Reply rate" are composite/percentage metrics and
 * intentionally aren't drill-down-able (see executive/page.tsx).
 */
export async function getRecordsByFilter(filter: ExecutiveRecordFilter) {
  const supabase = createClient();

  if (filter === "in_progress") {
    const { data } = await supabase
      .from("accounts")
      .select("id, company_name, status, priority, owner:profiles(full_name)")
      .in("status", ["in_progress", "engaged", "assigned"])
      .order("updated_at", { ascending: false });
    return { type: "accounts" as const, label: "Accounts in progress", rows: data ?? [] };
  }

  if (filter === "hot") {
    const { data } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, status, priority, account:accounts(company_name)")
      .or("priority.eq.urgent,status.eq.positive_reply")
      .order("updated_at", { ascending: false });
    return { type: "contacts" as const, label: "Hot prospects", rows: data ?? [] };
  }

  // stale
  const { data } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, status, priority, last_contacted_at, account:accounts(company_name)")
    .not("status", "in", '("closed","not_interested")')
    .order("last_contacted_at", { ascending: true, nullsFirst: true });

  const now = Date.now();
  const rows = (data ?? []).filter((c) => {
    if (!c.last_contacted_at) return true;
    const days = (now - new Date(c.last_contacted_at).getTime()) / 86400000;
    return days >= 14;
  });
  return { type: "contacts" as const, label: "Stale prospects (14d+)", rows };
}

/**
 * Phase 7 — full team leaderboard. Extends the dashboard's per-rep activity
 * counts (already computed in lib/data/analytics.ts) with two more real,
 * computable-from-existing-data signals: reply rate (positive replies ÷
 * emails sent, same definition used for the org-wide number) and follow-up
 * discipline (completed ÷ total assigned tasks, and how many are currently
 * overdue — using the real `overdue` status the scheduled Netlify function
 * already maintains, not a fabricated quota).
 */
export async function getTeamLeaderboard() {
  const supabase = createClient();
  const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [profilesRes, activitiesRes, tasksRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, avatar_url"),
    supabase.from("activities").select("activity_type, outcome, created_by").gte("created_at", sixtyDaysAgo.toISOString()),
    supabase.from("tasks").select("status, assigned_to"),
  ]);

  const profiles = profilesRes.data ?? [];
  const activities = activitiesRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  return profiles
    .map((p) => {
      const mine = activities.filter((a) => a.created_by === p.id);
      const myTasks = tasks.filter((t) => t.assigned_to === p.id);
      const emails = mine.filter((a) => a.activity_type === "email").length;
      const positiveReplies = mine.filter((a) => (a.outcome ?? "").toLowerCase().includes("positive")).length;
      const completedTasks = myTasks.filter((t) => t.status === "completed").length;
      const overdueTasks = myTasks.filter((t) => t.status === "overdue").length;

      return {
        id: p.id,
        name: p.full_name,
        role: p.role,
        avatarUrl: p.avatar_url,
        emails,
        calls: mine.filter((a) => a.activity_type === "call").length,
        linkedin: mine.filter((a) => a.activity_type === "linkedin").length,
        meetings: mine.filter((a) => a.activity_type === "meeting").length,
        total: mine.length,
        replyRate: emails > 0 ? Math.round((positiveReplies / emails) * 1000) / 10 : null,
        totalTasks: myTasks.length,
        completedTasks,
        overdueTasks,
        completionRate: myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 1000) / 10 : null,
      };
    })
    .filter((u) => u.total > 0 || u.totalTasks > 0)
    .sort((a, b) => b.total - a.total);
}
