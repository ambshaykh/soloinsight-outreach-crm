import { requireProfile } from "@/lib/auth/session";
import { listProfiles } from "@/lib/data/profiles";
import { listAuditLogsForReview } from "@/lib/data/audit";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { StatTile } from "@/components/shared/stat-tile";
import { AuditLogTable } from "@/components/settings/audit-log-table";
import { ShieldCheck, ScrollText, Activity, Users } from "lucide-react";

export default async function AdminSecurityPage() {
  await requireProfile();

  const [profiles, auditLogs] = await Promise.all([listProfiles(), listAuditLogsForReview(500)]);
  const enabledCount = profiles.filter((p) => p.two_factor_enabled).length;
  const last24h = auditLogs.filter((l: any) => Date.now() - new Date(l.created_at).getTime() < 86400000).length;
  const uniqueActors = new Set(auditLogs.map((l: any) => l.user?.full_name).filter(Boolean)).size;

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Security & audit</h1>
        <p className="text-sm text-[#6B7280]">Two-factor enforcement and the full access audit trail.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={ShieldCheck} label="2FA enabled" value={enabledCount} sublabel={`of ${profiles.length}`} tone={enabledCount === profiles.length ? "success" : "warning"} />
        <StatTile icon={ScrollText} label="Events loaded" value={auditLogs.length} sublabel="most recent 500" tone="neutral" />
        <StatTile icon={Activity} label="Last 24 hours" value={last24h} tone="primary" />
        <StatTile icon={Users} label="Active actors" value={uniqueActors} sublabel="in loaded window" tone="neutral" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> 2FA enforcement — workspace</CardTitle>
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScrollText className="h-4 w-4 text-primary" /> Audit log</CardTitle>
          <CardDescription>
            Every login, role change, and sensitive action, with before/after detail where available. Filter, expand a
            row for the diff, and export to CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={auditLogs as any} />
        </CardContent>
      </Card>
    </PageTransition>
  );
}
