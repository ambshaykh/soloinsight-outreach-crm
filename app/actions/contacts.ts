"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { ContactStatus, PriorityLevel } from "@/lib/types/database";
import { sendNotification } from "@/lib/notifications/send";

export async function createContact(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();

  const payload = {
    account_id: (String(formData.get("account_id") ?? "")) || null,
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    title: (String(formData.get("title") ?? "")) || null,
    email: (String(formData.get("email") ?? "")) || null,
    phone: (String(formData.get("phone") ?? "")) || null,
    linkedin_url: (String(formData.get("linkedin_url") ?? "")) || null,
    priority: (String(formData.get("priority") ?? "medium")) as PriorityLevel,
    owner_id: (String(formData.get("owner_id") ?? "")) || profile.id,
    created_by: profile.id,
    next_follow_up_at: (String(formData.get("next_follow_up_at") ?? "")) || null,
    notes: (String(formData.get("notes") ?? "")) || null,
  };

  if (!payload.first_name || !payload.last_name) return { error: "First and last name are required." };

  const { data, error } = await supabase.from("contacts").insert(payload).select().single();
  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: "contact.created", p_entity_type: "contact", p_entity_id: data.id,
    p_metadata: { name: `${payload.first_name} ${payload.last_name}` },
  });

  revalidatePath("/contacts");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { error: null, contact: data };
}

export async function updateContactStatus(contactId: string, status: ContactStatus) {
  await requireProfile();
  const supabase = createClient();
  const { data: before } = await supabase.from("contacts").select("status").eq("id", contactId).single();
  const { error } = await supabase.from("contacts").update({ status }).eq("id", contactId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "contact.status_changed", p_entity_type: "contact", p_entity_id: contactId,
    p_metadata: { before: before?.status ?? null, after: status },
  });
  revalidatePath("/contacts");
  revalidatePath("/outreach-queue");
  return { error: null };
}

export async function updateContactPriority(contactId: string, priority: PriorityLevel) {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("contacts").update({ priority }).eq("id", contactId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "contact.priority_changed", p_entity_type: "contact", p_entity_id: contactId, p_metadata: { priority },
  });
  revalidatePath("/contacts");
  revalidatePath("/outreach-queue");
  return { error: null };
}

export async function assignContactOwner(contactId: string, ownerId: string) {
  const actor = await requireProfile();
  const supabase = createClient();
  const { data: before } = await supabase.from("contacts").select("owner_id, first_name, last_name").eq("id", contactId).single();
  const { error } = await supabase.from("contacts").update({ owner_id: ownerId }).eq("id", contactId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "contact.owner_assigned", p_entity_type: "contact", p_entity_id: contactId,
    p_metadata: { before: before?.owner_id ?? null, after: ownerId },
  });

  if (ownerId && ownerId !== actor.id) {
    const name = before ? `${before.first_name} ${before.last_name}` : "A contact";
    await sendNotification({
      recipientId: ownerId,
      eventKey: "contact.assigned",
      fallbackTitle: `${name} was assigned to you`,
      fallbackBody: `${actor.full_name} assigned you this contact.`,
      vars: { contact: name, actor: actor.full_name },
      link: `/contacts/${contactId}`,
    });
  }

  revalidatePath("/contacts");
  return { error: null };
}

export async function deleteContact(contactId: string) {
  await requireProfile();
  const supabase = createClient();

  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: "contact.deleted", p_entity_type: "contact", p_entity_id: contactId, p_metadata: {},
  });

  revalidatePath("/contacts");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/outreach-queue");
  return { error: null };
}

/** Bulk-deletes contacts selected via the checkboxes on the Contacts table. */
export async function bulkDeleteContacts(contactIds: string[]) {
  await requireProfile();
  if (contactIds.length === 0) return { error: null, deleted: 0 };
  const supabase = createClient();

  const { error, count } = await supabase.from("contacts").delete({ count: "exact" }).in("id", contactIds);
  if (error) return { error: error.message, deleted: 0 };

  await supabase.rpc("log_audit_event", {
    p_action: "contact.bulk_deleted", p_entity_type: "contact", p_entity_id: null,
    p_metadata: { count: contactIds.length, ids: contactIds },
  });

  revalidatePath("/contacts");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/outreach-queue");
  return { error: null, deleted: count ?? contactIds.length };
}

export async function snoozeContactFollowUp(contactId: string, days: number) {
  await requireProfile();
  const supabase = createClient();
  const newDate = new Date();
  newDate.setDate(newDate.getDate() + days);
  const { error } = await supabase.from("contacts").update({ next_follow_up_at: newDate.toISOString() }).eq("id", contactId);
  if (error) return { error: error.message };
  revalidatePath("/outreach-queue");
  revalidatePath("/follow-ups");
  return { error: null };
}
