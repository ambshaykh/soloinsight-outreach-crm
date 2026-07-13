"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, MapPin, Users2, Gauge } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { OwnerSelect } from "@/components/shared/owner-select";
import { ACCOUNT_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { updateAccountStatus, updateAccountPriority, assignAccountOwner } from "@/app/actions/accounts";
import type { Account, AccountStatus, PriorityLevel, Profile } from "@/lib/types/database";

export function AccountDetailHeader({ account, owner }: { account: Account; owner: Profile | null }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleStatus(status: string) {
    startTransition(async () => {
      const r = await updateAccountStatus(account.id, status as AccountStatus);
      if (r.error) toast.error(r.error); else { toast.success("Status updated"); router.refresh(); }
    });
  }

  function handlePriority(priority: string) {
    startTransition(async () => {
      const r = await updateAccountPriority(account.id, priority as PriorityLevel);
      if (r.error) toast.error(r.error); else { toast.success("Priority updated"); router.refresh(); }
    });
  }

  function handleOwner(ownerId: string) {
    startTransition(async () => {
      const r = await assignAccountOwner(account.id, ownerId);
      if (r.error) toast.error(r.error); else { toast.success("Owner updated"); router.refresh(); }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F1419]">{account.company_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
            {account.domain && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {account.domain}</span>}
            {account.region && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {account.region}</span>}
            {account.company_size && <span className="flex items-center gap-1"><Users2 className="h-3.5 w-3.5" /> {account.company_size}</span>}
            <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> ICP {account.icp_score}</span>
          </div>
        </div>
        <div className="w-36">
          <p className="mb-1 text-right text-[11px] font-medium text-[#6B7280]">Priority</p>
          <Select defaultValue={account.priority} onValueChange={handlePriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="mb-1 text-[11px] font-medium text-[#6B7280]">Status</p>
          <Select defaultValue={account.status} onValueChange={handleStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ACCOUNT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-[#6B7280]">Owner</p>
          <OwnerSelect value={owner?.id} onChange={handleOwner} />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-[#6B7280]">Industry</p>
          <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{account.industry ?? "—"}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-[#6B7280]">Source</p>
          <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{account.source ?? "—"}</p>
        </div>
      </div>

      {account.notes && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-[#6B7280]">{account.notes}</p>
      )}
    </div>
  );
}
