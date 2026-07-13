"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeDate, initials } from "@/lib/utils";
import { ACCOUNT_STATUS_LABELS } from "@/lib/constants";
import { updateAccountStatus } from "@/app/actions/accounts";
import type { Account, AccountStatus, Profile } from "@/lib/types/database";

type Row = Account & { owner: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null };

export function AccountsTable({ accounts }: { accounts: Row[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (accounts.length === 0) {
    return <EmptyState icon={Building2} title="No accounts yet" description="Add your first account to start building the pipeline." />;
  }

  function handleStatus(accountId: string, status: string) {
    startTransition(async () => {
      const r = await updateAccountStatus(accountId, status as AccountStatus);
      if (r.error) toast.error(r.error); else { toast.success("Status updated"); router.refresh(); }
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Industry</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>ICP</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Last Touched</TableHead>
          <TableHead>Next Follow-up</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <Link href={`/accounts/${a.id}`} className="font-medium text-[#0F1419] hover:text-primary hover:underline">
                {a.company_name}
              </Link>
              <p className="text-xs text-[#6B7280]">{a.domain}</p>
            </TableCell>
            <TableCell className="text-sm text-[#6B7280]">{a.industry ?? "—"}</TableCell>
            <TableCell>
              <Select defaultValue={a.status} onValueChange={(v) => handleStatus(a.id, v)}>
                <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell><PriorityBadge priority={a.priority} /></TableCell>
            <TableCell className="text-sm font-medium">{a.icp_score}</TableCell>
            <TableCell>
              {a.owner ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials(a.owner.full_name)}</AvatarFallback></Avatar>
                  <span className="text-sm">{a.owner.full_name}</span>
                </div>
              ) : "—"}
            </TableCell>
            <TableCell className="text-sm text-[#6B7280]">{formatRelativeDate(a.last_touched_at)}</TableCell>
            <TableCell className="text-sm text-[#6B7280]">{formatRelativeDate(a.next_follow_up_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
