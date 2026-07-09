"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, KeyRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/actions/auth";

type Step = "loading" | "enroll" | "verify-existing" | "done";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verified = factorsData?.totp?.find((f) => f.status === "verified");
      const unverified = factorsData?.totp?.find((f) => f.status !== "verified");

      if (verified) {
        setFactorId(verified.id);
        setStep("verify-existing");
        return;
      }

      if (unverified) {
        await supabase.auth.mfa.unenroll({ factorId: unverified.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "Soloinsight Outreach CRM" });
      if (enrollError) {
        setError(enrollError.message);
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("enroll");
    })();
  }, []);

  async function handleVerify() {
    if (!factorId || code.length < 6) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("profiles").update({ two_factor_enabled: true }).eq("user_id", userData.user.id);
      }

      setStep("done");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#0F1419]">
              {step === "verify-existing" ? "Verify your identity" : "Set up two-factor authentication"}
            </h1>
            <p className="text-xs text-[#6B7280]">
              Required before you can access the CRM.
            </p>
          </div>
        </div>

        {step === "loading" && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {step === "enroll" && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Scan this QR code with an authenticator app (Google Authenticator, 1Password, Authy).
            </p>
            {qrCode && (
              <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4">
                {/* qr_code from Supabase is an SVG data URI */}
                <img src={qrCode} alt="2FA QR code" className="h-40 w-40" />
              </div>
            )}
            {secret && (
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Can't scan? Enter manually</p>
                <p className="mt-1 font-mono text-sm tracking-widest text-[#0F1419]">{secret}</p>
              </div>
            )}
            <VerifyForm code={code} setCode={setCode} onSubmit={handleVerify} submitting={submitting} error={error} />
          </div>
        )}

        {step === "verify-existing" && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Enter the 6-digit code from your authenticator app to continue.
            </p>
            <VerifyForm code={code} setCode={setCode} onSubmit={handleVerify} submitting={submitting} error={error} />
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-[#0F1419]">2FA enabled. Redirecting…</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function VerifyForm({
  code, setCode, onSubmit, submitting, error,
}: { code: string; setCode: (v: string) => void; onSubmit: () => void; submitting: boolean; error: string | null }) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="code">6-digit code</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="pl-9 text-center text-lg tracking-[0.3em]"
          />
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
      )}
      <Button onClick={onSubmit} disabled={submitting || code.length < 6} className="w-full">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Verify &amp; continue
      </Button>
    </div>
  );
}
