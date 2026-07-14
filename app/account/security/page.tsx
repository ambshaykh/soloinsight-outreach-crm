import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default async function AccountSecurityPage() {
  const profile = await requireProfile();

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Security</h1>
        <p className="text-sm text-[#6B7280]">Two-factor authentication for your account.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Your security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
            <span className="text-sm">Two-factor authentication</span>
            <SecurityStatusBadge enabled={profile.two_factor_enabled} />
          </div>
          <p className="text-xs text-[#6B7280]">
            2FA is mandatory for every account. You were required to enable it before reaching your dashboard on first sign in.
          </p>
          <Link href="/2fa/setup"><Button variant="secondary">Re-run 2FA setup</Button></Link>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
