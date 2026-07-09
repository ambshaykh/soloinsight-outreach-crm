"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireProfile } from "@/lib/auth/session";
import type { UserRole } from "@/lib/types/database";

export async function updateUserRole(profileId: string, role: UserRole) {
  await requireRole(["admin"]);
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "user.role_changed", p_entity_type: "profile", p_entity_id: profileId, p_metadata: { role },
  });
  revalidatePath("/settings/users");
  return { error: null };
}

export async function toggleUserActive(profileId: string, isActive: boolean) {
  await requireRole(["admin"]);
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", profileId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: isActive ? "user.reactivated" : "user.deactivated",
    p_entity_type: "profile", p_entity_id: profileId, p_metadata: {},
  });
  revalidatePath("/settings/users");
  return { error: null };
}

export async function updateOwnProfile(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { error: null };
}

export async function createTeam(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Team name is required." };
  const { error } = await supabase.from("teams").insert({ name, created_by: profile.id });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { error: null };
}
