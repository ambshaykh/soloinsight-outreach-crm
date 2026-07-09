"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";

export async function createTask(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();

  const payload = {
    account_id: (String(formData.get("account_id") ?? "")) || null,
    contact_id: (String(formData.get("contact_id") ?? "")) || null,
    title: String(formData.get("title") ?? "").trim(),
    description: (String(formData.get("description") ?? "")) || null,
    due_date: String(formData.get("due_date") ?? new Date().toISOString()),
    priority: (String(formData.get("priority") ?? "medium")) as any,
    assigned_to: (String(formData.get("assigned_to") ?? "")) || profile.id,
    created_by: profile.id,
  };

  if (!payload.title) return { error: "Title is required." };
  const { error } = await supabase.from("tasks").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/follow-ups");
  revalidatePath("/outreach-queue");
  return { error: null };
}

export async function completeTask(taskId: string) {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "task.completed", p_entity_type: "task", p_entity_id: taskId, p_metadata: {},
  });
  revalidatePath("/follow-ups");
  revalidatePath("/outreach-queue");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function snoozeTask(taskId: string, days: number) {
  await requireProfile();
  const supabase = createClient();
  const { data: task } = await supabase.from("tasks").select("due_date").eq("id", taskId).single();
  const base = task?.due_date ? new Date(task.due_date) : new Date();
  base.setDate(base.getDate() + days);
  const { error } = await supabase.from("tasks").update({ status: "snoozed", due_date: base.toISOString() }).eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath("/follow-ups");
  revalidatePath("/outreach-queue");
  return { error: null };
}

export async function completeContactTasks(contactId: string) {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("tasks").update({ status: "completed" }).eq("contact_id", contactId).eq("status", "open");
  if (error) return { error: error.message };
  revalidatePath("/follow-ups");
  revalidatePath("/outreach-queue");
  return { error: null };
}
