"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { updateContactStatus } from "@/app/actions/contacts";
import { initials, fullName } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/shared/priority-badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Contact, ContactStatus } from "@/lib/types/database";

export function KanbanBoard({ contacts }: { contacts: (Contact & { account?: { company_name: string } | null })[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOverCol, setDragOverCol] = useState<ContactStatus | null>(null);

  function handleDrop(status: ContactStatus, contactId: string) {
    setDragOverCol(null);
    startTransition(async () => {
      const r = await updateContactStatus(contactId, status);
      if (r.error) toast.error(r.error); else { toast.success("Moved to " + status.replace(/_/g, " ")); router.refresh(); }
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => {
        const items = contacts.filter((c) => c.status === col.status);
        return (
          <div
            key={col.status}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => { const id = e.dataTransfer.getData("text/contact-id"); if (id) handleDrop(col.status, id); }}
            className={cn(
              "flex w-64 shrink-0 flex-col rounded-xl border bg-slate-50/60 p-2 transition-colors",
              dragOverCol === col.status ? "border-primary bg-blue-50/60" : "border-slate-200"
            )}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-[#0F1419]">{col.label}</p>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#6B7280] shadow-sm">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/contact-id", c.id)}
                  className="cursor-grab rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px]">{initials(fullName(c.first_name, c.last_name))}</AvatarFallback></Avatar>
                    <Link href={`/contacts/${c.id}`} className="text-xs font-medium text-[#0F1419] hover:underline">
                      {c.first_name} {c.last_name}
                    </Link>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-[#6B7280]">{c.account?.company_name ?? ""}</p>
                  <div className="mt-1.5"><PriorityBadge priority={c.priority} /></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
