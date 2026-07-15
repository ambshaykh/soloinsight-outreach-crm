// Scheduled Netlify Function — runs on the cron declared in netlify.toml.
// Finds open follow-up tasks past their due date and notifies the assignee
// in-app (subject to the "task.overdue" notification template).
import { checkOverdueTasksAndNotify } from "../../lib/notifications/overdue-check";

export async function handler() {
  const result = await checkOverdueTasksAndNotify();
  console.log(`Overdue tasks check: ${result.checked} overdue, ${result.notified} notified.`);
  return { statusCode: 200, body: JSON.stringify(result) };
}
