import { requireProfile } from "@/lib/auth/session";
import { listProfiles, listAuditLogs } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck, ScrollText } from "lucide-react";

export default async function AdminSecurityPage() {
  await requireProfile();

  const [profiles, auditLogs] = await Promise.all([listProfiles(), listAuditLogs(100)]);
  const enabledCount = profiles.filter((p) => p.two_factor_enabled).length;

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Security & audit</h1>
        <p className="text-sm text-[#6B7280]">Two-factor enforcement and the full access audit trail.</p>
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
    </PageTransition>
  );
}
