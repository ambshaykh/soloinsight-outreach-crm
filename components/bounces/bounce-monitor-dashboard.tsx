"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Flame, Snowflake, CalendarDays, CalendarClock, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptySearchState } from "@/components/shared/state-patterns";
import { formatDateTime } from "@/lib/utils";

type BounceRow = {
  id: string;
  email: string;
  bounce_type: "hard" | "soft";
  reason: string | null;
  campaign_label: string | null;
  bounced_at: string;
  contact: { id: string; first_name: string; last_name: string } | null;
  account: { id: string; company_name: string } | null;
};

const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: BounceRow[]): string {
  const columns = ["bounced_at", "email", "bounce_type", "reason", "contact", "account", "campaign_label"];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.bounced_at,
        r.email,
        r.bounce_type,
        r.reason ?? "",
        r.contact ? `${r.contact.first_name} ${r.contact.last_name}` : "",
        r.account?.company_name ?? "",
        r.campaign_label ?? "",
      ]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}

export function BounceMonitorDashboard({ bounces }: { bounces: BounceRow[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Fixed KPI tiles — always computed off the full unfiltered set, so they
  // keep answering "how many bounced in each time window" regardless of
  // what the list below is currently filtered to.
  const kpis = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const today = bounces.filter((b) => new Date(b.bounced_at) >= startOfToday).length;
    const week = bounces.filter((b) => now - new Date(b.bounced_at).getTime() < 7 * 86400000).length;
    const month = bounces.filter((b) => now - new Date(b.bounced_at).getTime() < 30 * 86400000).length;
    const hard30d = bounces.filter((b) => b.bounce_type === "hard" && now - new Date(b.bounced_at).getTime() < 30 * 86400000).length;
    const soft30d = bounces.filter((b) => b.bounce_type === "soft" && now - new Date(b.bounced_at).getTime() < 30 * 86400000).length;
    return { today, week, month, hard30d, soft30d };
  }, [bounces]);

  const filtered = useMemo(() => {
    const cutoff = { "24h": 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000 }[dateRange as "24h" | "7d" | "30d"];
    return bounces.filter((b) => {
      if (typeFilter !== "all" && b.bounce_type !== typeFilter) return false;
      if (cutoff && Date.now() - new Date(b.bounced_at).getTime() > cutoff) return false;
      if (search && !b.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [bounces, typeFilter, dateRange, search]);

  function clearFilters() {
    setSearch(""); setTypeFilter("all"); setDateRange("all");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={CalendarClock} label="Today" value={kpis.today} tone="neutral" />
        <StatTile icon={CalendarDays} label="This week" value={kpis.week} tone="neutral" />
        <StatTile icon={CalendarRange} label="This month" value={kpis.month} tone="primary" />
        <StatTile icon={Flame} label="Hard bounces (30d)" value={kpis.hard30d} tone="danger" />
        <StatTile icon={Snowflake} label="Soft bounces (30d)" value={kpis.soft30d} tone="warning" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email address…"
          className="h-8 w-56 text-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Bounce type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="soft">Soft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="secondary" className="ml-auto" onClick={() => download("bounces.csv", toCsv(filtered))}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <p className="text-[11px] text-[#8B95A5]">{filtered.length} shown of {bounces.length} loaded (most recent 2,000) · sorted newest first</p>

      {filtered.length === 0 ? (
        <EmptySearchState onClearFilters={clearFilters} />
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {filtered.map((b) => (
            <div key={b.id} className="flex items-center gap-3 px-3 py-2.5">
              <span
                className={
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase " +
                  (b.bounce_type === "hard"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700")
                }
              >
                {b.bounce_type}
              </span>
              <span className="w-36 shrink-0 text-[11px] text-[#8B95A5]">{formatDateTime(b.bounced_at)}</span>
              <span className="w-48 shrink-0 truncate text-sm font-medium text-[#0F1419]">{b.email}</span>
              <span className="w-40 shrink-0 truncate text-sm text-[#6B7280]">
                {b.contact ? (
                  <Link href={`/contacts/${b.contact.id}`} className="hover:underline">
                    {b.contact.first_name} {b.contact.last_name}
                  </Link>
                ) : (
                  "Unmatched"
                )}
              </span>
              <span className="w-36 shrink-0 truncate text-sm text-[#6B7280]">
                {b.account ? <Link href={`/accounts/${b.account.id}`} className="hover:underline">{b.account.company_name}</Link> : "—"}
              </span>
              <span className="flex-1 truncate text-sm text-[#6B7280]">{b.reason ?? "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
