"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Mail, Phone, StickyNote, Clock3, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ContactStatusBadge } from "@/components/shared/status-badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogActivityModal } from "@/components/activities/log-activity-modal";
import { initials, fullName, formatRelativeDate } from "@/lib/utils";
import { snoozeContactFollowUp, updateContactStatus } from "@/app/actions/contacts";
import { completeContactTasks } from "@/app/actions/tasks";
import { CONTACT_STATUS_LABELS } from "@/lib/constants";
import type { Contact, ContactStatus } from "@/lib/types/database";

type Row = Contact & {
  account?: { id: string; company_name: string } | null;
  owner?: { full_name: string } | null;
  emailTouches: number; callTouches: number; daysSinceTouch: number | null;
};

function suggestedAction(c: Row): string {
  if (c.emailTouches === 0 && c.callTouches === 0) return "Make first touch";
  if (c.callTouches > 0 && c.emailTouches === 0) return "Send follow-up email";
  if (c.emailTouches > 0 && c.callTouches === 0) return "Attempt a call";
  if (c.status === "positive_reply") return "Book a meeting";
  if (c.daysSinceTouch !== null && c.daysSinceTouch >= 14) return "Re-engage — gone cold";
  return "Follow up";
}

export function QueueCard({ contact }: { contact: Row }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [logType, setLogType] = useState<"email" | "call" | "note" | null>(null);
  const name = fullName(contact.first_name, contact.last_name);

  function run(promise: Promise<{ error: string | null }>, successMsg: string) {
    startTransition(async () => {
      const r = await promise;
      if (r.error) toast.error(r.error); else { toast.success(successMsg); router.refresh(); }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{initials(name)}</AvatarFallback></Avatar>
          <div>
            <Link href={`/contacts/${contact.id}`} className="text-sm font-semibold text-[#0F1419] hover:underline">{name}</Link>
            <p className="text-xs text-[#6B7280]">{contact.title ?? "—"} {contact.account ? `· ${contact.account.company_name}` : ""}</p>
          </div>
        </div>
        <PriorityBadge priority={contact.priority} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[#6B7280]">
        <span>{contact.owner?.full_name ?? "Unassigned"}</span>
        <span>Last touch: {formatRelativeDate(contact.last_contacted_at)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <ContactStatusBadge status={contact.status} />
        <span className="text-[11px] font-medium text-primary">{suggestedAction(contact)}</span>
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
        <Button size="sm" variant="ghost" onClick={() => setLogType("call")}><Phone className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setLogType("email")}><Mail className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setLogType("note")}><StickyNote className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={() => run(snoozeContactFollowUp(contact.id, 3), "Snoozed 3 days")}>
          <Clock3 className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost"><ArrowRightLeft className="h-3.5 w-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {Object.entries(CONTACT_STATUS_LABELS).map(([v, l]) => (
              <DropdownMenuItem key={v} onSelect={() => run(updateContactStatus(contact.id, v as ContactStatus), "Status updated")}>
                {l}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="secondary" className="ml-auto" onClick={() => run(completeContactTasks(contact.id), "Marked complete")}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Done
        </Button>
      </div>

      <LogActivityModal
        open={logType !== null}
        onOpenChange={(o) => !o && setLogType(null)}
        contactId={contact.id}
        contactName={name}
        accountId={contact.account_id}
        defaultType={logType === "note" ? "note" : logType ?? "email"}
      />
    </div>
  );
}
