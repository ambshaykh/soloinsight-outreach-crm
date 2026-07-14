"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessPortal, PORTALS, type PortalSlug } from "@/lib/auth/portals";
import type { UserRole } from "@/lib/types/database";

/** Generic sign-in, kept for the legacy /login shim and any non-portal callers. */
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("signIn failed:", { message: error.message, status: error.status, name: error.name });
    return { error: error.message || "Sign-in failed. Please try again." };
  }

  await supabase.rpc("log_audit_event", {
    p_action: "user.login",
    p_entity_type: "auth",
    p_entity_id: null,
    p_metadata: { email },
  });

  return { error: null };
}

/**
 * Sign-in for a specific portal login page. Authenticates against the same
 * Supabase Auth user directory as every other portal, then checks the
 * profile's role against that portal's allow-list. If the role isn't
 * permitted, the session is immediately signed back out so a mismatched
 * login never leaves a live session behind.
 */
export async function signInToPortal(portal: PortalSlug, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error("signInToPortal failed:", { message: signInError.message, status: signInError.status, name: signInError.name, portal });
    return { error: signInError.message || "Sign-in failed. Please try again." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user?.id)
    .single();

  const role = profile?.role as UserRole | undefined;

  if (!role || !canAccessPortal(role, portal)) {
    await supabase.rpc("log_audit_event", {
      p_action: "user.portal_access_denied",
      p_entity_type: "auth",
      p_entity_id: null,
      p_metadata: { email, portal },
    });
    await supabase.auth.signOut();
    return { error: `Your account doesn't have access to the ${PORTALS[portal].name} portal.` };
  }

  await supabase.rpc("log_audit_event", {
    p_action: "user.login",
    p_entity_type: "auth",
    p_entity_id: null,
    p_metadata: { email, portal },
  });

  return { error: null, home: PORTALS[portal].home };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.rpc("log_audit_event", {
    p_action: "user.logout",
    p_entity_type: "auth",
    p_entity_id: null,
    p_metadata: {},
  });
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { error: null };
}
