"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { requestPasswordReset, updatePassword } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useState(() => {
    createClient().auth.getSession().then(({ data }) => setHasSession(!!data.session));
  });

  function handleRequest(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(formData);
      if (result?.error) setError(result.error);
      else setSent(true);
    });
  }

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) setError(result.error);
      else setDone(true);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cg-hero p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <Logo className="mb-6 text-[#0F1419]" />

        {hasSession ? (
          <>
            <h1 className="text-lg font-semibold text-[#0F1419]">Set a new password</h1>
            <p className="mt-1 text-xs text-[#6B7280]">Choose a strong password for your account.</p>
            {done ? (
              <p className="mt-6 text-sm text-emerald-700">Password updated. You can now sign in.</p>
            ) : (
              <form action={handleUpdate} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="password" name="password" type="password" required minLength={8} className="pl-9" />
                  </div>
                </div>
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            )}
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-[#0F1419]">Reset your password</h1>
            <p className="mt-1 text-xs text-[#6B7280]">We'll email you a secure reset link.</p>
            {sent ? (
              <p className="mt-6 text-sm text-emerald-700">Check your inbox for a reset link.</p>
            ) : (
              <form action={handleRequest} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Work email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="email" name="email" type="email" required className="pl-9" />
                  </div>
                </div>
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            )}
          </>
        )}

        <a href="/login" className="mt-6 block text-center text-xs font-medium text-primary hover:underline">
          Back to sign in
        </a>
      </div>
    </div>
  );
}
