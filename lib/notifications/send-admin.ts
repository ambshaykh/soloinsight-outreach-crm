// Admin-client variant of lib/notifications/send.ts, deliberately with NO
// import from lib/supabase/server (which pulls in next/headers). This file
// is imported by lib/salesforce/sync.ts, which in turn gets bundled into the
// scheduled Netlify Function (netlify/functions/salesforce-sync.ts) — that
// bundler runs outside the Next.js runtime, and next/headers has already
// caused one bundling headache before (see the "server-only" package fix).
// Keeping this dependency-free avoids repeating that.

type Vars = Record<string, string>;
type SupabaseLike = { from: (t: string) => any; rpc: (fn: string, args: any) => any };

function render(template: string, vars: Vars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function sendNotificationAsAdmin(
  client: SupabaseLike,
  opts: {
    recipientId: string | null | undefined;
    eventKey: string;
    fallbackTitle: string;
    fallbackBody?: string;
    vars?: Vars;
    link?: string;
  }
) {
  if (!opts.recipientId) return;
  try {
    const { data: tpl } = await client
      .from("notification_templates")
      .select("subject, body, active")
      .eq("event_key", opts.eventKey)
      .eq("channel", "in_app")
      .maybeSingle();

    if (tpl && tpl.active === false) return;

    const vars = opts.vars ?? {};
    const title = tpl?.subject ? render(tpl.subject, vars) : opts.fallbackTitle;
    const body = tpl?.body ? render(tpl.body, vars) : opts.fallbackBody ?? null;

    await client.rpc("notify", {
      p_recipient_id: opts.recipientId,
      p_event_key: opts.eventKey,
      p_title: title,
      p_body: body,
      p_link: opts.link ?? null,
    });
  } catch (e) {
    console.error(`sendNotificationAsAdmin(${opts.eventKey}) failed:`, e);
  }
}
