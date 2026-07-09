"use client";

import Link from "next/link";
import { CalendarClock, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ContactStatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeDate } from "@/lib/utils";
import type { Contact, Task } from "@/lib/types/database";

export function TodaysFollowUpsWidget({ tasks }: { tasks: (Task & { contact?: any })[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> Today's Follow Ups</CardTitle>
        <Link href="/follow-ups" className="text-xs font-medium text-primary hover:underline">View all</Link>
      </CardHeader>
      <CardContent className="pt-3">
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#6B7280]">Nothing due today. Nice work staying ahead.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-[#0F1419]">{t.title}</p>
                  <p className="text-xs text-[#6B7280]">
                    {t.contact ? `${t.contact.first_name} ${t.contact.last_name}` : "—"} · {formatRelativeDate(t.due_date)}
                  </p>
                </div>
                <PriorityBadge priority={t.priority} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentlyTouchedWidget({ contacts }: { contacts: Contact[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Recently Touched</CardTitle>
        <Link href="/contacts" className="text-xs font-medium text-primary hover:underline">View all</Link>
      </CardHeader>
      <CardContent className="pt-3">
        {contacts.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#6B7280]">No outreach logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                <div>
                  <Link href={`/contacts/${c.id}`} className="text-sm font-medium text-[#0F1419] hover:underline">
                    {c.first_name} {c.last_name}
                  </Link>
                  <p className="text-xs text-[#6B7280]">{formatRelativeDate(c.last_contacted_at)}</p>
                </div>
                <ContactStatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function NeedsAttentionWidget({ contacts }: { contacts: Contact[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Needs Attention</CardTitle>
        <Link href="/outreach-queue" className="text-xs font-medium text-primary hover:underline">View queue</Link>
      </CardHeader>
      <CardContent className="pt-3">
        {contacts.length === 0 ? (
          <EmptyState icon={ArrowUpRight} title="Everyone's covered" description="No contact has gone quiet for 7+ days." />
        ) : (
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2">
                <div>
                  <Link href={`/contacts/${c.id}`} className="text-sm font-medium text-[#0F1419] hover:underline">
                    {c.first_name} {c.last_name}
                  </Link>
                  <p className="text-xs text-[#6B7280]">Last touch {formatRelativeDate(c.last_contacted_at)}</p>
                </div>
                <PriorityBadge priority={c.priority} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
