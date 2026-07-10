import Link from "next/link";
import { requireProfile, canManageTeam } from "@/lib/auth/session";
import { listTeams } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { DataImportExport } from "@/components/settings/data-import-export";
import { ROLE_LABELS } from "@/lib/constants";
import { updateOwnProfile, createTeam } from "@/app/actions/users";
import { Users, ShieldCheck, Database, Building } from "lucide-react";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const canManage = canManageTeam(profile.role);
  const teams = canManage ? await listTeams() : [];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Settings</h1>
        <p className="text-sm text-[#6B7280]">Manage your profile, workspace, and data.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async (fd) => { await updateOwnProfile(fd); }} className="space-y-3">
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
            <Link href="/settings/security"><Button variant="secondary">Manage security settings</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Team &amp; Users</CardTitle>
            <CardDescription>
              {canManage ? "Invite teammates and manage roles." : "Contact an admin to change your role or team."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/users"><Button variant="secondary">Open user management</Button></Link>
          </CardContent>
        </Card>

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building className="h-4 w-4 text-primary" /> Workspace</CardTitle>
              <CardDescription>Teams organize reps for reporting and assignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1 text-sm">
                {teams.map((t: any) => <li key={t.id} className="rounded-lg border border-slate-100 px-3 py-2">{t.name}</li>)}
              </ul>
              <form action={async (fd) => { await createTeam(fd); }} className="flex gap-2">
                <Input name="name" placeholder="New team name" />
                <Button type="submit" variant="secondary">Add</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Data</CardTitle>
            <CardDescription>Export your pipeline, or bulk-import accounts and contacts from CSV.</CardDescription>
          </CardHeader>
          <CardContent><DataImportExport /></CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
