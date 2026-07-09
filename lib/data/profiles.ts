import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export async function listProfiles() {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return data as Profile[];
}

export async function listTeams() {
  const supabase = createClient();
  const { data, error } = await supabase.from("teams").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function listInvitations() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("*, invited_by_profile:profiles!invitations_invited_by_fkey(full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listAuditLogs(limit = 100) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, user:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
