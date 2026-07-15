"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkPortalAccessAndRoute } from "@/app/actions/auth";
import type { PortalSlug } from "@/lib/auth/portals";

/**
 * "Sign in with passkey" — discoverable-credential flow. No email field:
 * the browser/authenticator resolves the account from the passkey it has
 * stored, matching how Supabase's signInWithPasskey() works.
 */
export function PasskeySignInButton({ portal }: { portal: PortalSlug }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPasskey();
    if (signInError) {
      setError(signInError.message || "Passkey sign-in didn't complete.");
      setLoading(false);
      return;
    }

    const result = await checkPortalAccessAndRoute(portal);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(result.home ?? "/");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F1419] shadow-sm transition-all hover:shadow-md disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4 text-primary" />}
        Sign in with passkey
      </button>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
