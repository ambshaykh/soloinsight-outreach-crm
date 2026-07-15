"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessPortal, PORTALS, type PortalSlug } from "@/lib/auth/portals";
import type { UserRole } from "@/lib/types/database";
import { requireProfile } from "@/lib/auth/session";

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
  await supabase.rpc("log_audit_event", {
    p_action: "user.password_changed", p_entity_type: "auth", p_entity_id: null, p_metadata: {},
  });
  return { error: null };
}

/**
 * Signs out every OTHER active session for the current user, keeping this
 * one alive. This is the self-service equivalent of the admin-side
 * "deactivate" ban — useful if you suspect a lost device or left a session
 * open somewhere. Supabase doesn't expose a way to list those other
 * sessions individually, so this is an all-or-nothing revoke rather than a
 * per-device list.
 */
export async function signOutOtherSessions() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "user.signed_out_other_sessions", p_entity_type: "auth", p_entity_id: null, p_metadata: {},
  });
  return { error: null };
}

/**
 * Called client-side right after a successful `signInWithPasskey()` (which
 * establishes the session via the browser, before this action ever runs).
 * Same portal-role check as the password/Google paths — a passkey proves
 * *who* someone is, not *which portal* they're allowed into, so this still
 * needs to run before they land anywhere.
 */
export async function checkPortalAccessAndRoute(portal: PortalSlug) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign-in didn't complete. Please try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, passkey_enrolled")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "This account isn't set up in the CRM. Ask an admin for an invite." };
  }

  if (!canAccessPortal(profile.role, portal)) {
    await supabase.rpc("log_audit_event", {
      p_action: "user.portal_access_denied", p_entity_type: "auth", p_entity_id: null,
      p_metadata: { portal, method: "passkey" },
    });
    await supabase.auth.signOut();
    return { error: `Your account doesn't have access to the ${PORTALS[portal].name} portal.` };
  }

  await supabase.rpc("log_audit_event", {
    p_action: "user.login", p_entity_type: "auth", p_entity_id: null, p_metadata: { method: "passkey", portal },
  });

  return { error: null, home: PORTALS[portal].home };
}

/** Marks the current user's mandatory passkey setup as complete. */
export async function markPasskeyEnrolled() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ passkey_enrolled: true }).eq("id", profile.id);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "user.passkey_enrolled", p_entity_type: "auth", p_entity_id: null, p_metadata: {},
  });
  return { error: null };
}
