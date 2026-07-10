"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { signIn } from "@/app/actions/auth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(params.get("redirect") || "/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Hero panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        {/* Flowing animated gradient base */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(120deg, #050d22 0%, #0b1d4a 14%, #1E3A8A 28%, #2450a8 42%, #4f46e5 54%, #1E3A5F 68%, #13306f 84%, #050d22 100%)",
            backgroundSize: "220% 220%",
          }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating color blobs — "colors within colors" */}
        <motion.div
          className="absolute -left-24 top-6 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/40 via-blue-400/20 to-transparent blur-3xl mix-blend-screen"
          animate={{ x: [0, 50, -20, 0], y: [0, -30, 25, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-16 top-1/3 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-violet-500/40 via-fuchsia-500/15 to-transparent blur-3xl mix-blend-screen"
          animate={{ x: [0, -35, 30, 0], y: [0, 35, -20, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/30 via-cyan-300/15 to-transparent blur-3xl mix-blend-screen"
          animate={{ x: [0, 30, -25, 0], y: [0, -20, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(91,156,255,0.2),transparent_45%)]" />

        <Logo className="relative z-10 text-white" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <motion.p
            className="bg-gradient-to-r from-cyan-300 via-blue-100 to-violet-300 bg-clip-text text-xs font-semibold uppercase tracking-widest text-transparent"
            style={{ backgroundSize: "200% 100%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            Manual Outreach CRM
          </motion.p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Every call. Every email.
            <br />
            Tracked, owned, and followed up.
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Soloinsight Outreach CRM keeps your SDR and sales ops team accountable —
            no automated sends, no autodialers, just clean visibility into manual
            outbound work.
          </p>
        </motion.div>
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/60">
          <ShieldCheck className="h-4 w-4 text-cg-accentLight" />
          Enterprise-grade RLS, role-based access, and mandatory 2FA.
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/50 p-8">
        <motion.div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-200/50 via-violet-200/30 to-transparent blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-200/40 via-blue-100/20 to-transparent blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Animated gradient glow halo behind the card */}
          <motion.div
            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400/40 via-violet-400/40 to-cyan-400/40 blur-lg"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative rounded-2xl border border-slate-100 bg-white/90 p-8 shadow-xl shadow-blue-500/5 backdrop-blur-sm">
            <div className="mb-8 lg:hidden">
              <Logo className="text-[#0F1419]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#0F1419]">Welcome back</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Sign in to your outreach workspace.</p>

            <form
              action={handleSubmit}
              className="mt-8 space-y-4"
            >
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

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-[#6B7280]">
              This CRM is invite-only. Ask your admin for an invite link.
            </p>

            <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-[#6B7280]">
              <p className="font-semibold text-slate-600">Demo credentials (after seeding)</p>
              <p>admin@soloinsight.com · manager@soloinsight.com · sdr1@soloinsight.com</p>
              <p>Password: Password123!</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}