import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { SignOutOthersButton } from "@/components/settings/sign-out-others-button";
import { ShieldCheck, KeyRound, Monitor } from "lucide-react";

export default async function AccountSecurityPage() {
  const profile = await requireProfile();

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Security</h1>
        <p className="text-sm text-[#6B7280]">Password, two-factor authentication, and active sessions for your account.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Two-factor authentication</CardTitle>
            <CardDescription>Optional now — no longer required to sign in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <span className="text-sm">Two-factor authentication</span>
              <SecurityStatusBadge enabled={profile.two_factor_enabled} />
            </div>
            <p className="text-xs text-[#6B7280]">
              No longer required — Google Sign-In is the primary way in now. You can still turn TOTP on
              as an extra layer if you want it.
            </p>
            <Link href="/2fa/setup"><Button variant="secondary">{profile.two_factor_enabled ? 'Manage 2FA' : 'Set up 2FA'}</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Password</CardTitle>
            <CardDescription>Change your sign-in password.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /> Sessions</CardTitle>
            <CardDescription>
              If you think you're signed in somewhere you shouldn't be, sign out of every other device. This one stays signed in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutOthersButton />
            <p className="mt-2 text-[11px] text-[#8B95A5]">
              Supabase doesn't expose a per-device list to pick from individually — this revokes all sessions except this one, in one step.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
