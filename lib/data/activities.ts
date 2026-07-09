import { createClient } from "@/lib/supabase/server";

export interface ActivityFilters {
  userId?: string;
  activityType?: string;
  accountId?: string;
  contactId?: string;
  dateFrom?: string;
  dateTo?: string;
  outcome?: string;
  limit?: number;
}

export async function listActivities(filters: ActivityFilters = {}) {
  const supabase = createClient();
  let query = supabase
    .from("activities")
    .select(
      `*,
      contact:contacts(id, first_name, last_name, account_id),
      account:accounts(id, company_name),
      created_by_profile:profiles!activities_created_by_fkey(id, full_name, avatar_url)`
    )
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.userId) query = query.eq("created_by", filters.userId);
  if (filters.activityType) query = query.eq("activity_type", filters.activityType);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  if (filters.contactId) query = query.eq("contact_id", filters.contactId);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  if (filters.outcome) query = query.eq("outcome", filters.outcome);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
