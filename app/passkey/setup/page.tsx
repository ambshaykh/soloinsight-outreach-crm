"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Fingerprint, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { createClient } from "@/lib/supabase/client";
import { markPasskeyEnrolled, signOut } from "@/app/actions/auth";
import { PORTALS, type PortalSlug } from "@/lib/auth/portals";

type Step = "prompt" | "registering" | "done" | "error";

function PasskeySetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("prompt");
  const [error, setError] = useState<string | null>(null);

  const portal = searchParams.get("portal") as PortalSlug | null;
  const redirectTarget = searchParams.get("redirect");
  const home = redirectTarget || (portal && PORTALS[portal]?.home) || "/";

  async function handleRegister() {
    setStep("registering");
    setError(null);
    const supabase = createClient();

    // registerPasskey() must run from a real click (WebAuthn requires user
    // activation to invoke navigator.credentials.create()) — that's why this
    // isn't auto-triggered on page load like the old TOTP enrollment was.
    const { error: registerError } = await supabase.auth.registerPasskey();
    if (registerError) {
      setError(registerError.message || "Passkey setup didn't complete. You can try again.");
      setStep("error");
      return;
    }

    const result = await markPasskeyEnrolled();
    if (result.error) {
      setError(result.error);
      setStep("error");
      return;
    }

    setStep("done");
    setTimeout(() => {
      router.push(home);
      router.refresh();
    }, 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cg-hero p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo className="text-[#0F1419]" />
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#0F1419]">Set up a passkey</h1>
            <p className="text-xs text-[#6B7280]">Required before you can access the CRM.</p>
          </div>
        </div>

        {step === "prompt" && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              A passkey lets you sign in with your fingerprint, face, screen lock, or a hardware security key —
              no password to type or steal. Your browser or password manager will prompt you next.
            </p>
            <Button onClick={handleRegister} className="w-full">
              <Fingerprint className="h-4 w-4" /> Set up my passkey
            </Button>
          </div>
        )}

        {step === "registering" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-[#6B7280]">Follow the prompt from your browser or device…</p>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
            <Button onClick={handleRegister} className="w-full">Try again</Button>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-[#0F1419]">Passkey registered. Redirecting…</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function PasskeySetupPage() {
  return (
    <Suspense fallback={null}>
      <PasskeySetupInner />
    </Suspense>
  );
}
