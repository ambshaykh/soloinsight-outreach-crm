"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { getInvitationByToken, acceptInvitation } from "@/app/actions/invitations";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/types/database";

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "done">("loading");
  const [invite, setInvite] = useState<{ email: string; role: UserRole } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInvitationByToken(params.token).then((res) => {
      if (res.invitation) {
        setInvite({ email: res.invitation.email, role: res.invitation.role });
        setStatus("valid");
      } else {
        setStatus("invalid");
      }
    });
  }, [params.token]);

  function handleSubmit(formData: FormData) {
    setError(null);
    const fullName = String(formData.get("full_name") ?? "");
    const password = String(formData.get("password") ?? "");
    startTransition(async () => {
      const result = await acceptInvitation(params.token, fullName, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus("done");
      setTimeout(() => router.push("/"), 1800);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cg-hero p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <Logo className="mb-6 text-[#0F1419]" />

        {status === "loading" && (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        )}

        {status === "invalid" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <XCircle className="h-10 w-10 text-rose-400" />
            <p className="text-sm font-medium text-[#0F1419]">This invite link is invalid or has expired.</p>
            <p className="text-xs text-[#6B7280]">Ask your admin to send a new invitation.</p>
          </div>
        )}

        {status === "valid" && invite && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#0F1419]">Join Soloinsight Outreach</h1>
                <p className="text-xs text-[#6B7280]">
                  {invite.email} · invited as {ROLE_LABELS[invite.role]}
                </p>
              </div>
            </div>
            <form action={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" required placeholder="Jane Doe" />
              </div>
              <div>
                <Label htmlFor="password">Create a password</Label>
                <Input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </Button>
              <p className="text-center text-[11px] text-[#6B7280]">
                You'll be required to set up two-factor authentication on first sign in.
              </p>
            </form>
          </>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium text-[#0F1419]">Account created. Redirecting to sign in…</p>
          </div>
        )}
      </div>
    </div>
  );
}
