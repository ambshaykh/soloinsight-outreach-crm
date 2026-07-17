import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRecordsByFilter, type ExecutiveRecordFilter } from "@/lib/data/executive";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { AccountStatusBadge, ContactStatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate } from "@/lib/utils";
import type { AccountStatus, ContactStatus } from "@/lib/types/database";

const VALID_FILTERS: ExecutiveRecordFilter[] = ["in_progress", "hot", "stale"];

export default async function ExecutiveRecordsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = VALID_FILTERS.includes(searchParams.filter as ExecutiveRecordFilter)
    ? (searchParams.filter as ExecutiveRecordFilter)
    : "in_progress";

  const result = await getRecordsByFilter(filter);

  return (
    <div>
      <Link href="/executive" className="mb-4 flex w-fit items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#0F1419]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">{result.label}</h1>
        <p className="text-sm text-[#6B7280]">
          {result.rows.length} {result.type} · the exact records behind that dashboard number, read-only.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {result.rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#6B7280]">Nothing here right now.</p>
          ) : result.type === "accounts" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(result.rows as any[]).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm font-medium text-[#0F1419]">{a.company_name}</TableCell>
                    <TableCell><AccountStatusBadge status={a.status as AccountStatus} /></TableCell>
                    <TableCell><PriorityBadge priority={a.priority} /></TableCell>
                    <TableCell className="text-sm text-[#6B7280]">{a.owner?.full_name ?? "Unassigned"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  {filter === "stale" && <TableHead>Last contacted</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(result.rows as any[]).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium text-[#0F1419]">{c.first_name} {c.last_name}</TableCell>
                    <TableCell className="text-sm text-[#6B7280]">{c.account?.company_name ?? "—"}</TableCell>
                    <TableCell><ContactStatusBadge status={c.status as ContactStatus} /></TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    {filter === "stale" && (
                      <TableCell className="text-sm text-[#6B7280]">{formatRelativeDate(c.last_contacted_at)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
