import { createClient } from "@/lib/supabase/server";

/** Top-priority accounts and contacts, for the executive dashboard's priority widget. */
export async function getTopPriorityItems(limit = 8) {
  const supabase = createClient();

  const [accountsRes, contactsRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, company_name, status, priority")
      .in("priority", ["high", "urgent"])
      .order("priority", { ascending: false })
      .limit(limit),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, status, priority, account:accounts(company_name)")
      .in("priority", ["high", "urgent"])
      .order("priority", { ascending: false })
      .limit(limit),
  ]);

  return {
    accounts: accountsRes.data ?? [],
    contacts: contactsRes.data ?? [],
  };
}
