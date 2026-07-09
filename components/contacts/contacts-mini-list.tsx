"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContactStatusBadge } from "@/components/shared/status-badge";
import { LogActivityModal } from "@/components/activities/log-activity-modal";
import { initials, fullName } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import type { Contact } from "@/lib/types/database";

export function ContactsMiniList({ contacts, accountId }: { contacts: Contact[]; accountId: string }) {
  const [logging, setLogging] = useState<{ id: string; name: string; type: "email" | "call" } | null>(null);

  if (contacts.length === 0) {
    return <EmptyState icon={Users} title="No contacts yet" description="Add a contact to start prospecting this account." />;
  }

  return (
    <>
      <ul className="space-y-2">
        {contacts.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback>{initials(fullName(c.first_name, c.last_name))}</AvatarFallback></Avatar>
              <div>
                <Link href={`/contacts/${c.id}`} className="text-sm font-medium text-[#0F1419] hover:underline">
                  {c.first_name} {c.last_name}
                </Link>
                <p className="text-xs text-[#6B7280]">{c.title ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ContactStatusBadge status={c.status} />
              <Button size="icon" variant="ghost" onClick={() => setLogging({ id: c.id, name: fullName(c.first_name, c.last_name), type: "email" })}>
                <Mail className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setLogging({ id: c.id, name: fullName(c.first_name, c.last_name), type: "call" })}>
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <LogActivityModal
        open={!!logging}
        onOpenChange={(o) => !o && setLogging(null)}
        contactId={logging?.id}
        contactName={logging?.name}
        accountId={accountId}
        defaultType={logging?.type ?? "email"}
      />
    </>
  );
}
