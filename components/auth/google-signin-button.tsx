"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PortalSlug } from "@/lib/auth/portals";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.87c2.27-2.09 3.58-5.17 3.58-8.66z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.87-3.01c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.24v3.11C3.22 21.3 7.28 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.26A7.15 7.15 0 0 1 4.9 12c0-.78.14-1.54.37-2.26V6.63H1.24A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.24 5.37l4.03-3.11z" />
      <path fill="#EA4335" d="M12 4.78c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.28 0 3.22 2.7 1.24 6.63l4.03 3.11C6.22 6.89 8.87 4.78 12 4.78z" />
    </svg>
  );
}

/**
 * "Continue with Google" — kicks off Supabase's OAuth redirect flow.
 * `portal` is threaded through as a query param so /auth/callback knows
 * which portal's role-gate to check once Google hands back a session.
 */
export function GoogleSignInButton({ portal }: { portal: PortalSlug }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?portal=${portal}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success the browser navigates away to Google — no further UI update needed.
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F1419] shadow-sm transition-all hover:shadow-md disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleGlyph />}
        Continue with Google
      </button>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
