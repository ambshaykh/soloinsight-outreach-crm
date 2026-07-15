"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Lock, Mail, ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { signInToPortal } from "@/app/actions/auth";
import { PORTALS, type PortalSlug } from "@/lib/auth/portals";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { PasskeySignInButton } from "@/components/auth/passkey-signin-button";

function PortalLoginForm({ portal }: { portal: PortalSlug }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const config = PORTALS[portal];

  const deniedFor = params.get("denied");
  const deniedMessage =
    deniedFor === "not_invited"
      ? "That Google account hasn't been invited to this CRM. Ask your admin for an invite."
      : deniedFor === "oauth_error"
      ? "Google sign-in didn't complete. Please try again."
      : deniedFor
      ? `Your account doesn't have access to the ${PORTALS[deniedFor as PortalSlug]?.name ?? deniedFor} portal.`
      : null;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInToPortal(portal, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(params.get("redirect") || result.home || config.home);
      router.refresh();
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-6 py-10 text-white">
      {/* Flowing animated gradient — covers the whole page, unique per portal */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundImage: config.gradient, backgroundSize: "220% 220%" }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating color blobs for depth */}
      <motion.div
        className={`absolute -left-24 top-10 h-96 w-96 rounded-full bg-gradient-to-br ${config.accent} blur-3xl mix-blend-screen`}
        animate={{ x: [0, 50, -20, 0], y: [0, -30, 25, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute -right-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${config.accent} blur-3xl mix-blend-screen`}
        animate={{ x: [0, -35, 30, 0], y: [0, 35, -20, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute -bottom-32 left-1/3 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br ${config.accent} blur-3xl mix-blend-screen`}
        animate={{ x: [0, 30, -25, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.12),transparent_45%)]" />

      {/* Back to portal selector */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <Logo className="text-white" />
          <Link href="/" className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All portals
          </Link>
        </div>
      </div>

      {/* Headline block */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mt-10 max-w-lg text-center"
      >
        <motion.p
          className="bg-gradient-to-r from-white via-white/70 to-white bg-clip-text text-xs font-semibold uppercase tracking-widest text-transparent"
          style={{ backgroundSize: "200% 100%" }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {config.eyebrow}
        </motion.p>
        <h1 className="mt-3 whitespace-pre-line text-2xl font-semibold leading-tight sm:text-3xl">
          {config.headline}
        </h1>
        <p className="mt-3 text-sm text-white/70">{config.subhead}</p>
      </motion.div>

      {/* Floating "hovering" sign-in card */}
      <div className="relative z-10 mt-10 flex w-full flex-1 items-center justify-center">
        <div className="relative w-full max-w-sm">
          <motion.div
            className="absolute inset-x-6 bottom-[-2.5rem] h-8 rounded-full bg-black/40 blur-xl"
            animate={{ opacity: [0.5, 0.25, 0.5], scaleX: [1, 0.85, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <motion.div
              className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${config.accent} blur-xl`}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative rounded-2xl border border-white/60 bg-white/95 p-8 text-[#0F1419] shadow-2xl backdrop-blur-md">
              <h2 className="text-2xl font-semibold text-[#0F1419]">{config.name} sign in</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Sign in to the {config.name} portal.</p>

              {deniedMessage && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {deniedMessage}
                </div>
              )}

              <div className="mt-8 space-y-2.5">
                <GoogleSignInButton portal={portal} />
                <PasskeySignInButton portal={portal} />
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] uppercase tracking-wide text-[#8B95A5]">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {!showPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(true)}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#0F1419]"
                >
                  Use password instead <ChevronDown className="h-3.5 w-3.5" />
                </button>
              ) : (
                <form action={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Work email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="email" name="email" type="email" required placeholder="you@company.com" className="pl-9" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a href="/reset-password" className="text-xs font-medium text-primary hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="password" name="password" type="password" required placeholder="••••••••" className="pl-9" />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" variant="secondary" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sign in with password
                  </Button>
                </form>
              )}

              <p className="mt-6 text-center text-xs text-[#6B7280]">
                This CRM is invite-only. Ask your admin for an invite link.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mt-12 flex items-center gap-2 text-xs text-white/60">
        <ShieldCheck className="h-4 w-4" />
        Enterprise-grade RLS, role-based access, and passkey-secured sign-in.
      </div>
    </div>
  );
}

export function PortalLoginView({ portal }: { portal: PortalSlug }) {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm portal={portal} />
    </Suspense>
  );
}
