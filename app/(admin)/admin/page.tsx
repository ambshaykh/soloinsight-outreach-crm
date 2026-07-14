import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { listTeams } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataImportExport } from "@/components/settings/data-import-export";
import { createTeam } from "@/app/actions/users";
import { Users, KeyRound, Building, Database } from "lucide-react";

export default async function AdminOverviewPage() {
  await requireProfile();
  const teams = await listTeams();

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Admin Center</h1>
        <p className="text-sm text-[#6B7280]">Manage users, roles, teams, and workspace data.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Users & Teams</CardTitle>
            <CardDescription>Invite teammates and manage roles.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users"><Button variant="secondary">Open user management</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Roles & Permissions</CardTitle>
            <CardDescription>Control exactly what each role can see and do.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/roles"><Button variant="secondary">Open permission matrix</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building className="h-4 w-4 text-primary" /> Workspace teams</CardTitle>
            <CardDescription>Teams organize reps for reporting and assignment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm">
              {teams.map((t: any) => <li key={t.id} className="rounded-lg border border-slate-100 px-3 py-2">{t.name}</li>)}
            </ul>
            <form action={createTeam} className="flex gap-2">
              <Input name="name" placeholder="New team name" />
              <Button type="submit" variant="secondary">Add</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Data</CardTitle>
            <CardDescription>Export the pipeline, or bulk-import accounts and contacts from CSV.</CardDescription>
          </CardHeader>
          <CardContent><DataImportExport /></CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
