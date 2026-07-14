import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { ROLE_LABELS } from "@/lib/constants";
import { PORTALS, portalsForRole } from "@/lib/auth/portals";
import { updateOwnProfile } from "@/app/actions/users";
import { ShieldCheck, LayoutGrid } from "lucide-react";

export default async function AccountPage() {
  const profile = await requireProfile();
  const myPortals = portalsForRole(profile.role);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">My account</h1>
        <p className="text-sm text-[#6B7280]">Personal profile and security — shared across every portal you can access.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateOwnProfile} className="space-y-3">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={profile.email} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={ROLE_LABELS[profile.role]} disabled />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Security</CardTitle>
            <CardDescription>Two-factor authentication is mandatory for every account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <span className="text-sm">Your 2FA status</span>
              <SecurityStatusBadge enabled={profile.two_factor_enabled} />
            </div>
            <Link href="/account/security"><Button variant="secondary">Manage security settings</Button></Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-primary" /> Your portals</CardTitle>
            <CardDescription>Portals your role ({ROLE_LABELS[profile.role]}) currently has access to.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {myPortals.map((slug) => (
                <Link
                  key={slug}
                  href={PORTALS[slug].home}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-[#0F1419] hover:border-primary hover:bg-blue-50/50"
                >
                  {PORTALS[slug].name}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
