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
      <div className="relative hidden flex-col justify-between overflow-hidden bg-cg-hero p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(91,156,255,0.25),transparent_45%)]" />
        <Logo className="relative z-10 text-white" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-cg-accentLight">
            Manual Outreach CRM
          </p>
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
      <div className="flex items-center justify-center bg-white p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
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
