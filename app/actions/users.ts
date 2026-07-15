"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, requireProfile } from "@/lib/auth/session";
import type { UserRole } from "@/lib/types/database";

// 100 years in hours — Supabase's ban_duration wants a Go-style duration
// string (h/m/s only, no "d" or "y"), so this is the practical "forever".
const INDEFINITE_BAN = "876000h";

export async function updateUserRole(profileId: string, role: UserRole) {
  await requireRole(["admin"]);
  const supabase = createClient();

  const { data: before } = await supabase.from("profiles").select("role").eq("id", profileId).single();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: "user.role_changed", p_entity_type: "profile", p_entity_id: profileId,
    p_metadata: { before: before?.role ?? null, after: role },
  });
  revalidatePath("/admin/users");
  return { error: null };
}

export async function toggleUserActive(profileId: string, isActive: boolean) {
  await requireRole(["admin"]);
  const supabase = createClient();

  const { data: target } = await supabase.from("profiles").select("user_id, is_active").eq("id", profileId).single();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", profileId);
  if (error) return { error: error.message };

  // Also enforce at the Supabase Auth layer, not just our own RLS/app gate —
  // a banned user can't sign in OR refresh an existing session, so this
  // takes effect immediately even if they're already logged in elsewhere.
  if (target?.user_id) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(target.user_id, {
        ban_duration: isActive ? "none" : INDEFINITE_BAN,
      });
    } catch (e) {
      console.error("toggleUserActive: failed to update Supabase Auth ban state:", e);
      // Not fatal — the profiles.is_active flag (checked by RLS/app logic) still applies.
    }
  }

  await supabase.rpc("log_audit_event", {
    p_action: isActive ? "user.reactivated" : "user.deactivated",
    p_entity_type: "profile", p_entity_id: profileId,
    p_metadata: { before: target?.is_active ?? null, after: isActive },
  });
  revalidatePath("/admin/users");
  return { error: null };
}

// Note: these two return void (not { error }) because they're wired directly to a
// native <form action={...}> in a Server Component — Next.js requires that signature.
// Errors are logged server-side rather than surfaced back into the form.
export async function updateOwnProfile(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  const supabase = createClient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
  if (error) { console.error("updateOwnProfile failed:", error.message); return; }
  revalidatePath("/account");
}

export async function createTeam(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin"]);
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) { console.error("createTeam failed: team name is required."); return; }
  const { error } = await supabase.from("teams").insert({ name, created_by: profile.id });
  if (error) { console.error("createTeam failed:", error.message); return; }
  revalidatePath("/admin");
}

/** Last sign-in timestamps, keyed by auth user_id — service-role only, used for the Admin Users page. */
export async function getLastSignInMap(): Promise<Record<string, string | null>> {
  await requireRole(["admin"]);
  try {
    const admin = createAdminClient();
    const map: Record<string, string | null> = {};
    let page = 1;
    // Paginate defensively; a small team won't need more than one page, but
    // this keeps it correct as the team grows past 1000 users.
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data) break;
      for (const u of data.users) map[u.id] = u.last_sign_in_at ?? null;
      if (data.users.length < 1000) break;
      page += 1;
    }
    return map;
  } catch (e) {
    console.error("getLastSignInMap failed:", e);
    return {};
  }
}

export async function updatePreferences(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();
  const preferences = {
    timezone: String(formData.get("timezone") ?? "UTC"),
    density: formData.get("density") === "compact" ? "compact" : "comfortable",
    high_contrast: formData.get("high_contrast") === "on",
    reduced_motion: formData.get("reduced_motion") === "on",
  };
  const { error } = await supabase.from("profiles").update({ preferences }).eq("id", profile.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}
