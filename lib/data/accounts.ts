import { createClient } from "@/lib/supabase/server";
import type { Account, Profile } from "@/lib/types/database";

export interface AccountFilters {
  search?: string;
  status?: string;
  owner?: string;
  industry?: string;
  priority?: string;
}

export async function listAccounts(filters: AccountFilters = {}) {
  const supabase = createClient();
  let query = supabase
    .from("accounts")
    .select("*, owner:profiles!accounts_owner_id_fkey(id, full_name, email, avatar_url)")
    .order("updated_at", { ascending: false });

  if (filters.search) query = query.ilike("company_name", `%${filters.search}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.owner) query = query.eq("owner_id", filters.owner);
  if (filters.industry) query = query.eq("industry", filters.industry);
  if (filters.priority) query = query.eq("priority", filters.priority);

  const { data, error } = await query;
  if (error) throw error;
  return data as (Account & { owner: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null })[];
}

export async function getAccountById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(
      "*, owner:profiles!accounts_owner_id_fkey(id, full_name, email, avatar_url), contacts(*)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAccountActivity(accountId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*, created_by_profile:profiles!activities_created_by_fkey(full_name, avatar_url), contact:contacts(first_name, last_name)")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
