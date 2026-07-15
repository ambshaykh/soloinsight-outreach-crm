import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationAsAdmin } from "@/lib/notifications/send-admin";

/**
 * Finds open tasks past their due date and notifies the assignee — at most
 * once per task per 20-hour window, so a task that's been overdue for a
 * week doesn't re-notify every run. Dedup is done by checking for an
 * existing notification with the same task-specific link rather than adding
 * a new "last_notified_at" column, to keep this additive to the schema.
 *
 * Deliberately has no dependency on lib/supabase/server (next/headers) —
 * this is imported by a scheduled Netlify Function, same reasoning as
 * lib/notifications/send-admin.ts.
 */
export async function checkOverdueTasksAndNotify(): Promise<{ checked: number; notified: number }> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const dedupeWindow = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();

  const { data: tasks, error } = await admin
    .from("tasks")
    .select("id, title, due_date, assigned_to, contact:contacts(first_name, last_name)")
    .eq("status", "open")
    .lt("due_date", nowIso)
    .not("assigned_to", "is", null);

  if (error || !tasks) {
    console.error("checkOverdueTasksAndNotify: failed to load tasks:", error?.message);
    return { checked: 0, notified: 0 };
  }

  let notified = 0;
  for (const task of tasks) {
    const link = `/follow-ups?task=${task.id}`;
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("link", link)
      .gte("created_at", dedupeWindow)
      .maybeSingle();
    if (existing) continue;

    const who = (task as any).contact ? `${(task as any).contact.first_name} ${(task as any).contact.last_name}` : null;
    await sendNotificationAsAdmin(admin, {
      recipientId: task.assigned_to,
      eventKey: "task.overdue",
      fallbackTitle: `Overdue: ${task.title}`,
      fallbackBody: who ? `This follow-up for ${who} is past its due date.` : "This follow-up is past its due date.",
      vars: { task: task.title, contact: who ?? "" },
      link,
    });
    notified += 1;
  }

  return { checked: tasks.length, notified };
}
