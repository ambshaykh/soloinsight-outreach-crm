"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ContactStatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LogActivityModal } from "@/components/activities/log-activity-modal";
import { formatRelativeDate, initials, fullName } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Contact, Profile } from "@/lib/types/database";

type Row = Contact & {
  account: { id: string; company_name: string; industry: string | null } | null;
  owner: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
};

export function ContactsTable({ contacts }: { contacts: Row[] }) {
  const [logging, setLogging] = useState<{ id: string; name: string; accountId: string | null; type: "email" | "call" } | null>(null);

  if (contacts.length === 0) {
    return <EmptyState icon={Users} title="No contacts yet" description="Add a contact to start manual outreach." />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Last Contacted</TableHead>
            <TableHead>Next Follow-up</TableHead>
            <TableHead>Quick Log</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{initials(fullName(c.first_name, c.last_name))}</AvatarFallback></Avatar>
                  <Link href={`/contacts/${c.id}`} className="font-medium text-[#0F1419] hover:text-primary hover:underline">
                    {c.first_name} {c.last_name}
                  </Link>
                </div>
              </TableCell>
              <TableCell className="text-sm text-[#6B7280]">
                {c.account ? <Link href={`/accounts/${c.account.id}`} className="hover:underline">{c.account.company_name}</Link> : "—"}
              </TableCell>
              <TableCell className="text-sm text-[#6B7280]">{c.title ?? "—"}</TableCell>
              <TableCell><ContactStatusBadge status={c.status} /></TableCell>
              <TableCell><PriorityBadge priority={c.priority} /></TableCell>
              <TableCell className="text-sm">{c.owner?.full_name ?? "—"}</TableCell>
              <TableCell className="text-sm text-[#6B7280]">{formatRelativeDate(c.last_contacted_at)}</TableCell>
              <TableCell className="text-sm text-[#6B7280]">{formatRelativeDate(c.next_follow_up_at)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setLogging({ id: c.id, name: fullName(c.first_name, c.last_name), accountId: c.account_id, type: "email" })}>
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setLogging({ id: c.id, name: fullName(c.first_name, c.last_name), accountId: c.account_id, type: "call" })}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <LogActivityModal
        open={!!logging}
        onOpenChange={(o) => !o && setLogging(null)}
        contactId={logging?.id}
        contactName={logging?.name}
        accountId={logging?.accountId}
        defaultType={logging?.type ?? "email"}
      />
    </>
  );
}
