"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export async function markNotificationRead(id: string) {
  const profile = await requireProfile();
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", profile.id);
  revalidatePath("/", "layout");
  return { error: null };
}

export async function markAllNotificationsRead() {
  const profile = await requireProfile();
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", profile.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
  return { error: null };
}

export async function upsertNotificationTemplate(input: {
  eventKey: string;
  channel: "email" | "in_app";
  label: string;
  subject: string;
  body: string;
  active: boolean;
}) {
  const profile = await requireProfile();
  if (!(await hasPermission("notifications.manage"))) {
    return { error: "You don't have permission to edit notification templates." };
  }
  const supabase = createClient();

  const { data: before } = await supabase
    .from("notification_templates")
    .select("subject, body, active")
    .eq("event_key", input.eventKey)
    .eq("channel", input.channel)
    .maybeSingle();

  const { error } = await supabase.from("notification_templates").upsert(
    {
      event_key: input.eventKey,
      channel: input.channel,
      label: input.label,
      subject: input.subject,
      body: input.body,
      active: input.active,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_key,channel" }
  );
  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: "notification_template.updated", p_entity_type: "notification_template", p_entity_id: null,
    p_metadata: { event_key: input.eventKey, channel: input.channel, before, after: { subject: input.subject, body: input.body, active: input.active } },
  });

  revalidatePath("/admin/notifications");
  return { error: null };
}

export async function setNotificationTemplateActive(eventKey: string, channel: "email" | "in_app", active: boolean) {
  if (!(await hasPermission("notifications.manage"))) {
    return { error: "You don't have permission to edit notification templates." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("notification_templates")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("event_key", eventKey)
    .eq("channel", channel);
  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: active ? "notification_template.enabled" : "notification_template.disabled",
    p_entity_type: "notification_template", p_entity_id: null,
    p_metadata: { event_key: eventKey, channel },
  });

  revalidatePath("/admin/notifications");
  return { error: null };
}
