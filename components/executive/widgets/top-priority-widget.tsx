import Link from "next/link";
import { PriorityBadge } from "@/components/shared/priority-badge";
import type { PriorityLevel } from "@/lib/types/database";

type TopPriorityData = {
  accounts: { id: string; company_name: string; status: string; priority: PriorityLevel }[];
  contacts: { id: string; first_name: string; last_name: string; status: string; priority: PriorityLevel; account?: { company_name: string } | null }[];
};

export function TopPriorityWidget({ data }: { data: TopPriorityData }) {
  if (data.accounts.length === 0 && data.contacts.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6B7280]">Nothing marked high or urgent priority right now.</p>;
  }
  const urgentCount = data.accounts.filter((a) => a.priority === "urgent").length + data.contacts.filter((c) => c.priority === "urgent").length;

  return (
    <div>
      <p className="mb-3 text-xs text-[#6B7280]">
        <span className="font-semibold text-[#0F1419]">{data.accounts.length + data.contacts.length}</span> items flagged ·{" "}
        <span className="font-semibold text-rose-600">{urgentCount}</span> urgent
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Accounts</p>
        <ul className="space-y-1.5">
          {data.accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-1.5">
              <Link href={`/accounts/${a.id}`} className="truncate text-sm font-medium text-[#0F1419] hover:underline">{a.company_name}</Link>
              <PriorityBadge priority={a.priority} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Contacts</p>
        <ul className="space-y-1.5">
          {data.contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-1.5">
              <Link href={`/contacts/${c.id}`} className="truncate text-sm font-medium text-[#0F1419] hover:underline">
                {c.first_name} {c.last_name}
                {c.account?.company_name && <span className="text-[#6B7280]"> · {c.account.company_name}</span>}
              </Link>
              <PriorityBadge priority={c.priority} />
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}
