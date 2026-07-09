"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, Linkedin, Building2, Loader2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { OwnerSelect } from "@/components/shared/owner-select";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogActivityModal } from "@/components/activities/log-activity-modal";
import { CONTACT_STATUS_LABELS } from "@/lib/constants";
import { updateContactStatus, assignContactOwner } from "@/app/actions/contacts";
import { initials, fullName } from "@/lib/utils";
import type { Contact, ContactStatus, Profile, Account } from "@/lib/types/database";

export function ContactDetailHeader({ contact, owner, account }: { contact: Contact; owner: Profile | null; account: Account | null }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [logType, setLogType] = useState<"email" | "call" | null>(null);

  function handleStatus(status: string) {
    startTransition(async () => {
      const r = await updateContactStatus(contact.id, status as ContactStatus);
      if (r.error) toast.error(r.error); else { toast.success("Status updated"); router.refresh(); }
    });
  }

  function handleOwner(ownerId: string) {
    startTransition(async () => {
      const r = await assignContactOwner(contact.id, ownerId);
      if (r.error) toast.error(r.error); else { toast.success("Owner updated"); router.refresh(); }
    });
  }

  const name = fullName(contact.first_name, contact.last_name);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14"><AvatarFallback className="text-base">{initials(name)}</AvatarFallback></Avatar>
          <div>
            <h1 className="text-xl font-semibold text-[#0F1419]">{name}</h1>
            <p className="text-sm text-[#6B7280]">{contact.title ?? "—"}</p>
            {account && (
              <a href={`/accounts/${account.id}`} className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
                <Building2 className="h-3.5 w-3.5" /> {account.company_name}
              </a>
            )}
          </div>
        </div>
        <PriorityBadge priority={contact.priority} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#6B7280]">
        {contact.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {contact.email}</span>}
        {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {contact.phone}</span>}
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" className="flex items-center gap-1 text-primary hover:underline">
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
          </a>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="mb-1 text-[11px] font-medium text-[#6B7280]">Status</p>
          <Select defaultValue={contact.status} onValueChange={handleStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTACT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-[#6B7280]">Owner</p>
          <OwnerSelect value={owner?.id} onChange={handleOwner} />
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="text-[11px] font-medium text-[#6B7280]">Email touchpoints</p>
          <p className="text-sm font-semibold">{contact.email_touch_count}</p>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="text-[11px] font-medium text-[#6B7280]">Call attempts</p>
          <p className="text-sm font-semibold">{contact.call_touch_count}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => setLogType("email")}><Mail className="h-4 w-4" /> Log Email</Button>
        <Button size="sm" variant="secondary" onClick={() => setLogType("call")}><Phone className="h-4 w-4" /> Log Call</Button>
      </div>

      {contact.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-[#6B7280]">{contact.notes}</p>}

      <LogActivityModal
        open={logType !== null}
        onOpenChange={(o) => !o && setLogType(null)}
        contactId={contact.id}
        contactName={name}
        accountId={contact.account_id}
        defaultType={logType ?? "email"}
      />
    </div>
  );
}
