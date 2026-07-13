"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { AccountStatus, PriorityLevel } from "@/lib/types/database";

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
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("accounts").update({ status }).eq("id", accountId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "account.status_changed", p_entity_type: "account", p_entity_id: accountId, p_metadata: { status },
  });
  revalidatePath("/accounts");
  return { error: null };
}

export async function updateAccountPriority(accountId: string, priority: PriorityLevel) {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("accounts").update({ priority }).eq("id", accountId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "account.priority_changed", p_entity_type: "account", p_entity_id: accountId, p_metadata: { priority },
  });
  revalidatePath("/accounts");
  return { error: null };
}

export async function assignAccountOwner(accountId: string, ownerId: string) {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("accounts").update({ owner_id: ownerId }).eq("id", accountId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "account.owner_assigned", p_entity_type: "account", p_entity_id: accountId, p_metadata: { owner_id: ownerId },
  });
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
