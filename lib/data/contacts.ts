import { createClient } from "@/lib/supabase/server";
import type { Contact, Profile } from "@/lib/types/database";

export interface ContactFilters {
  search?: string;
  status?: string;
  owner?: string;
  priority?: string;
  accountId?: string;
}

export async function listContacts(filters: ContactFilters = {}) {
  const supabase = createClient();
  let query = supabase
    .from("contacts")
    .select(
      "*, account:accounts(id, company_name, industry), owner:profiles!contacts_owner_id_fkey(id, full_name, email, avatar_url)"
    )
    .order("updated_at", { ascending: false });

  if (filters.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.owner) query = query.eq("owner_id", filters.owner);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);

  const { data, error } = await query;
  if (error) throw error;
  return data as (Contact & {
    account: { id: string; company_name: string; industry: string | null } | null;
    owner: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
  })[];
}

export async function getContactById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "*, account:accounts(*), owner:profiles!contacts_owner_id_fkey(id, full_name, email, avatar_url)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getContactActivity(contactId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*, created_by_profile:profiles!activities_created_by_fkey(full_name, avatar_url)")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getContactTasks(contactId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("contact_id", contactId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return data;
}
