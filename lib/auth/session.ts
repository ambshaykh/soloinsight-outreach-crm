import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types/database";
import { canAccessPortal, PORTALS, type PortalSlug } from "@/lib/auth/portals";

/**
 * `cache()` deduplicates calls made during the same server render pass —
 * middleware, the portal layout, and every page/component underneath it
 * were each calling this independently (2 Supabase round trips apiece),
 * which stacked into 10+ redundant network calls per navigation. Wrapping
 * it here means the first call still hits Supabase, and every other call
 * for the same request reuses that in-flight/resolved result for free.
 */
export const getCurrentUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (data as Profile) ?? null;
});

/** Use in a Server Component / layout to hard-require a signed-in profile. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  return profile;
}

/** Use to gate a page/section to a specific set of roles (defense in depth — RLS is the real gate). */
export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}

/**
 * Use at the top of every portal's layout.tsx. Requires a signed-in profile AND that the
 * profile's role is allowed into this portal — otherwise bounces back to the portal
 * selector with a `denied` flag so it can explain why.
 */
export async function requirePortalAccess(portal: PortalSlug): Promise<Profile> {
  const profile = await requireProfile();
  if (!canAccessPortal(profile.role, portal)) {
    redirect(`/?denied=${portal}`);
  }
  return profile;
}

/** Where should this (already authenticated) profile land if they hit a generic entry point? */
export function defaultHomeForRole(role: UserRole): string {
  const order: PortalSlug[] = ["sales", "admin", "salesforce", "executive"];
  for (const slug of order) {
    if (canAccessPortal(role, slug)) return PORTALS[slug].home;
  }
  return "/account";
}

export function canManageTeam(role: UserRole) {
  return role === "admin" || role === "manager";
}

export function isAdmin(role: UserRole) {
  return role === "admin";
}
