"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { UserRole } from "@/lib/types/database";

/**
 * Grants or revokes one permission for one role. Hardcoded to admin-only —
 * this is intentionally NOT gated by the "roles.manage" permission itself,
 * since that would let a misconfigured matrix lock every admin out of ever
 * fixing it. Only the literal `admin` role can edit this page.
 */
export async function toggleRolePermission(role: UserRole, permissionKey: string, enabled: boolean) {
  const admin = await requireRole(["admin"]);
  const supabase = createClient();

  if (enabled) {
    const { error } = await supabase.from("role_permissions").upsert({ role, permission_key: permissionKey });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role", role)
      .eq("permission_key", permissionKey);
    if (error) return { error: error.message };
  }

  await supabase.rpc("log_audit_event", {
    p_action: enabled ? "role_permission.granted" : "role_permission.revoked",
    p_entity_type: "role_permissions",
    p_entity_id: null,
    p_metadata: { role, permission: permissionKey, actor: admin.id },
  });

  revalidatePath("/settings/roles");
  return { error: null };
}
