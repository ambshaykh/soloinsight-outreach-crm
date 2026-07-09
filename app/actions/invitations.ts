"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import type { UserRole } from "@/lib/types/database";

export async function createInvitation(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const supabase = createClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "sdr") as UserRole;
  const teamId = String(formData.get("team_id") ?? "") || null;

  if (!email) return { error: "Email is required." };

  const { data, error } = await supabase
    .from("invitations")
    .insert({ email, role, team_id: teamId, invited_by: admin.id })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.rpc("log_audit_event", {
    p_action: "invitation.created",
    p_entity_type: "invitation",
    p_entity_id: data.id,
    p_metadata: { email, role },
  });

  revalidatePath("/settings/users");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { error: null, inviteUrl: `${appUrl}/invite/${data.token}` };
}

export async function revokeInvitation(invitationId: string) {
  await requireRole(["admin"]);
  const supabase = createClient();
  const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", invitationId);
  if (error) return { error: error.message };
  await supabase.rpc("log_audit_event", {
    p_action: "invitation.revoked", p_entity_type: "invitation", p_entity_id: invitationId, p_metadata: {},
  });
  revalidatePath("/settings/users");
  return { error: null };
}

export async function getInvitationByToken(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return { invitation: null };
  if (data.status !== "pending" || new Date(data.expires_at) < new Date()) {
    return { invitation: null, expired: true };
  }
  return { invitation: data };
}

export async function acceptInvitation(token: string, fullName: string, password: string) {
  const admin = createAdminClient();
  const { data: invitation, error: invError } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (invError || !invitation || invitation.status !== "pending") {
    return { error: "This invitation is no longer valid." };
  }
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "This invitation has expired. Ask an admin to send a new one." };
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) return { error: createError.message };

  return { error: null };
}
