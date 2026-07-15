import { createClient } from "@/lib/supabase/server";

type Vars = Record<string, string>;
type SupabaseLike = { from: (t: string) => any; rpc: (fn: string, args: any) => any };

function render(template: string, vars: Vars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

/**
 * Sends an in-app notification for `eventKey`, using that event's editable
 * template (Admin Center -> Notifications & Templates) if one exists and is
 * active, or the caller's fallback copy otherwise. Variables use the same
 * {{name}} syntax shown in the template editor.
 *
 * Safe to call from any server action — it never throws; a failed send is
 * logged and swallowed so a notification problem never blocks the actual
 * CRM action (status change, assignment, etc.) that triggered it.
 */
export async function sendNotification(opts: {
  recipientId: string | null | undefined;
  eventKey: string;
  fallbackTitle: string;
  fallbackBody?: string;
  vars?: Vars;
  link?: string;
  /** Pass the admin (service-role) client when calling from a context with no
   *  user session/cookies, like the scheduled Netlify sync function. */
  client?: SupabaseLike;
}) {
  if (!opts.recipientId) return;
  try {
    const supabase = opts.client ?? createClient();
    const { data: tpl } = await supabase
      .from("notification_templates")
      .select("subject, body, active")
      .eq("event_key", opts.eventKey)
      .eq("channel", "in_app")
      .maybeSingle();

    if (tpl && tpl.active === false) return; // explicitly disabled by an admin

    const vars = opts.vars ?? {};
    const title = tpl?.subject ? render(tpl.subject, vars) : opts.fallbackTitle;
    const body = tpl?.body ? render(tpl.body, vars) : opts.fallbackBody ?? null;

    await supabase.rpc("notify", {
      p_recipient_id: opts.recipientId,
      p_event_key: opts.eventKey,
      p_title: title,
      p_body: body,
      p_link: opts.link ?? null,
    });
  } catch (e) {
    console.error(`sendNotification(${opts.eventKey}) failed:`, e);
  }
}
