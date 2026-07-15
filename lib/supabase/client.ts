"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Passkey support is experimental in @supabase/supabase-js (opt-in,
        // API may still change) — see lib/supabase/PASSKEY_NOTES if that
        // ever changes upstream. Requires supabase-js >= 2.105.0.
        experimental: { passkey: true },
      },
    }
  );
}
