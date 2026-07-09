import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVICE ROLE client — bypasses RLS entirely. Never import this into any
// client component or expose it to the browser. Only used for privileged
// admin actions such as inviting a new teammate.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
