import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

export type Permission = {
  key: string;
  label: string;
  description: string | null;
  category: string;
  sort_order: number;
};

export async function listPermissionsCatalog(): Promise<Permission[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("category")
    .order("sort_order");
  if (error) {
    console.error("listPermissionsCatalog failed:", error.message);
    return [];
  }
  return data as Permission[];
}

/** Returns a Set of "role:permission_key" strings for every granted pairing. */
export async function listRolePermissionsMatrix(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("role_permissions").select("role, permission_key");
  if (error) {
    console.error("listRolePermissionsMatrix failed:", error.message);
    return new Set();
  }
  return new Set(data.map((r: any) => `${r.role}:${r.permission_key}`));
}

/** Server-side check for the CURRENT signed-in user. Admins always pass. */
export async function hasPermission(key: string): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile) return false;
  if (profile.role === "admin") return true;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permission_key")
    .eq("role", profile.role)
    .eq("permission_key", key)
    .maybeSingle();
  if (error) {
    console.error("hasPermission failed:", error.message);
    return false;
  }
  return !!data;
}
