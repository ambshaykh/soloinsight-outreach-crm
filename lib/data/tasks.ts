import { createClient } from "@/lib/supabase/server";

export interface TaskFilters {
  assignedTo?: string;
  status?: string;
  scope?: "mine" | "team";
}

export async function listTasks(filters: TaskFilters = {}) {
  const supabase = createClient();
  let query = supabase
    .from("tasks")
    .select(
      `*,
      contact:contacts(id, first_name, last_name, title, status, priority, account:accounts(company_name)),
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url)`
    )
    .order("due_date", { ascending: true });

  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
