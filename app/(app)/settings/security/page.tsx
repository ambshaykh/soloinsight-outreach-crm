import { requireProfile, canManageTeam } from "@/lib/auth/session";
import { listProfiles, listAuditLogs } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck, ScrollText } from "lucide-react";
import Link from "next/link";

export default async function SecuritySettingsPage() {
  const profile = await requireProfile();
  const canSeeTeamSecurity = canManageTeam(profile.role);

  const [profiles, auditLogs] = await Promise.all([
    canSeeTeamSecurity ? listProfiles() : Promise.resolve([]),
    canSeeTeamSecurity ? listAuditLogs(100) : Promise.resolve([]),
  ]);

  const enabledCount = profiles.filter((p) => p.two_factor_enabled).length;

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Security</h1>
        <p className="text-sm text-[#6B7280]">Two-factor authentication and access audit trail.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Your security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <span className="text-sm">Two-factor authentication</span>
              <SecurityStatusBadge enabled={profile.two_factor_enabled} />
            </div>
            <p className="text-xs text-[#6B7280]">
              2FA is mandatory for every account. You were required to enable it before reaching the dashboard on first sign in.
            </p>
            <Link href="/2fa/setup"><Button variant="secondary">Re-run 2FA setup</Button></Link>
          </CardContent>
        </Card>

        {canSeeTeamSecurity && (
          <Card>
            <CardHeader>
              <CardTitle>2FA enforcement — team</CardTitle>
              <CardDescription>{enabledCount} of {profiles.length} teammates have 2FA enabled.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.full_name}</TableCell>
                      <TableCell className="text-sm capitalize">{p.role}</TableCell>
                      <TableCell><SecurityStatusBadge enabled={p.two_factor_enabled} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {canSeeTeamSecurity && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ScrollText className="h-4 w-4 text-primary" /> Security audit log</CardTitle>
            <CardDescription>Every login, role change, and sensitive action, timestamped.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>When</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-[#6B7280]">{formatDateTime(log.created_at)}</TableCell>
                    <TableCell className="text-sm">{log.user?.full_name ?? "System"}</TableCell>
                    <TableCell className="text-sm font-medium">{log.action}</TableCell>
                    <TableCell className="text-xs text-[#6B7280]">{JSON.stringify(log.metadata)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}
