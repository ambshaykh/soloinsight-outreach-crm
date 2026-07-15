"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { AccountStatus, PriorityLevel } from "@/lib/types/database";
import { sendNotification } from "@/lib/notifications/send";

export async function createAccount(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();

  const payload = {
    company_name: String(formData.get("company_name") ?? "").trim(),
    domain: (String(formData.get("domain") ?? "").trim()) || null,
    industry: (String(formData.get("industry") ?? "")) || null,
    region: (String(formData.get("region") ?? "")) || null,
    company_size: (String(formData.get("company_size") ?? "")) || null,
    source: (String(formData.get("source") ?? "")) || null,
    priority: (String(formData.get("priority") ?? "medium")) as PriorityLevel,
    icp_score: Number(formData.get("icp_score") ?? 0),
    notes: (String(formData.get("notes") ?? "")) || null,
    owner_id: (String(formData.get("owner_id") ?? "")) || profile.id,
    created_by: profile.id,
    next_follow_up_at: (String(formData.get("next_follow_up_at") ?? "")) || null,
  };

  if (!payload.company_name) return { error: "Company name is required." };

  const { data, error } = await supabase.from("accounts").insert(payload).select().single();
  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: "account.created", p_entity_type: "account", p_entity_id: data.id,
    p_metadata: { company_name: payload.company_name },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { error: null, account: data };
}

export async function updateAccountStatus(accountId: string, status: AccountStatus) {
  const actor = await requireProfile();
  const supabase = createClient();
  const { data: before } = await supabase.from("accounts").select("status, company_name, owner_id").eq("id", accountId).single();
  const { error } = await supabase.from("accounts").update({ status }).eq("id", accountId);
  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: "account.status_changed", p_entity_type: "account", p_entity_id: accountId,
    p_metadata: { before: before?.status ?? null, after: status, company_name: before?.company_name },
  });

  // Notify the account's owner (if it's not the person making the change).
  if (before?.owner_id && before.owner_id !== actor.id) {
    await sendNotification({
      recipientId: before.owner_id,
      eventKey: "account.status_changed",
      fallbackTitle: `${before.company_name} moved to a new stage`,
      fallbackBody: `${actor.full_name} changed the status to "${status.replace(/_/g, " ")}".`,
      vars: { account: before.company_name, actor: actor.full_name, status: status.replace(/_/g, " ") },
      link: `/accounts/${accountId}`,
    });
  }

  revalidatePath("/accounts");
  return { error: null };
}

export async function updateAccountPriority(accountId: string, priority: PriorityLevel) {
  await requireProfile();
  const supabase = createClient();
  const { data: before } = await supabase.from("accounts").select("priority").eq("id", accountId).single();
  const { error } = await supabase.from("accounts").update({ priority }).eq("id", accountId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "account.priority_changed", p_entity_type: "account", p_entity_id: accountId,
    p_metadata: { before: before?.priority ?? null, after: priority },
  });
  revalidatePath("/accounts");
  return { error: null };
}

export async function assignAccountOwner(accountId: string, ownerId: string) {
  const actor = await requireProfile();
  const supabase = createClient();
  const { data: before } = await supabase.from("accounts").select("owner_id, company_name").eq("id", accountId).single();
  const { error } = await supabase.from("accounts").update({ owner_id: ownerId }).eq("id", accountId);
  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: "account.owner_assigned", p_entity_type: "account", p_entity_id: accountId,
    p_metadata: { before: before?.owner_id ?? null, after: ownerId, company_name: before?.company_name },
  });

  if (ownerId && ownerId !== actor.id) {
    await sendNotification({
      recipientId: ownerId,
      eventKey: "account.assigned",
      fallbackTitle: `${before?.company_name ?? "An account"} was assigned to you`,
      fallbackBody: `${actor.full_name} assigned you this account.`,
      vars: { account: before?.company_name ?? "An account", actor: actor.full_name },
      link: `/accounts/${accountId}`,
    });
  }

  revalidatePath("/accounts");
  return { error: null };
}

export async function updateAccountFollowUp(accountId: string, nextFollowUpAt: string | null) {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("accounts").update({ next_follow_up_at: nextFollowUpAt }).eq("id", accountId);
  if (error) return { error: error.message };
  revalidatePath("/accounts");
  return { error: null };
}
