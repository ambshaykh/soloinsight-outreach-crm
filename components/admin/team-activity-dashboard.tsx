"use client";

import { useMemo, useState } from "react";
import { Download, Mail, Phone, Linkedin, CalendarDays, StickyNote, Activity as ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptySearchState } from "@/components/shared/state-patterns";
import { formatDateTime, formatRelativeDate, initials } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

type ActivityRow = {
  id: string;
  activity_type: string;
  outcome: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
  contact: { id: string; first_name: string; last_name: string } | null;
  account: { id: string; company_name: string } | null;
  created_by_profile: { id: string; full_name: string; avatar_url: string | null } | null;
};

// Only the types actually ever written by the manual logging flow —
// status_change / owner_assignment go to audit_logs instead, never here.
const ACTIVITY_TYPE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
];

const TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail, call: Phone, linkedin: Linkedin, meeting: CalendarDays, note: StickyNote,
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

function toCsv(rows: ActivityRow[]): string {
  const columns = ["created_at", "rep", "activity_type", "outcome", "contact", "account", "notes"];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.created_at,
        r.created_by_profile?.full_name ?? "",
        r.activity_type,
        r.outcome ?? "",
        r.contact ? `${r.contact.first_name} ${r.contact.last_name}` : "",
        r.account?.company_name ?? "",
        r.notes ?? "",
      ]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}

export function TeamActivityDashboard({ activities, profiles }: { activities: ActivityRow[]; profiles: Profile[] }) {
  const [repFilter, setRepFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const filtered = useMemo(() => {
    const cutoff = { "24h": 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000 }[dateRange as "24h" | "7d" | "30d"];
    return activities.filter((a) => {
      if (repFilter !== "all" && a.created_by !== repFilter) return false;
      if (typeFilter !== "all" && a.activity_type !== typeFilter) return false;
      if (cutoff && Date.now() - new Date(a.created_at).getTime() > cutoff) return false;
      return true;
    });
  }, [activities, repFilter, typeFilter, dateRange]);

  const perRep = useMemo(() => {
    const byRep = new Map<string, { id: string; name: string; avatarUrl: string | null; total: number; byType: Record<string, number>; lastAt: string | null }>();
    for (const a of filtered) {
      const rep = a.created_by_profile;
      if (!rep) continue;
      const entry = byRep.get(rep.id) ?? { id: rep.id, name: rep.full_name, avatarUrl: rep.avatar_url, total: 0, byType: {}, lastAt: null };
      entry.total += 1;
      entry.byType[a.activity_type] = (entry.byType[a.activity_type] ?? 0) + 1;
      if (!entry.lastAt || new Date(a.created_at) > new Date(entry.lastAt)) entry.lastAt = a.created_at;
      byRep.set(rep.id, entry);
    }
    return Array.from(byRep.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  function clearFilters() {
    setRepFilter("all"); setTypeFilter("all"); setDateRange("all");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={repFilter} onValueChange={setRepFilter}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Rep" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reps</SelectItem>
            {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Activity type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ACTIVITY_TYPE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="secondary" className="ml-auto" onClick={() => download("team-activity.csv", toCsv(filtered))}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {perRep.length === 0 ? (
        <EmptySearchState onClearFilters={clearFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {perRep.map((rep) => (
              <div key={rep.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{initials(rep.name)}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium text-[#0F1419]">{rep.name}</p>
                    <p className="text-[11px] text-[#8B95A5]">Last activity {formatRelativeDate(rep.lastAt)}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">{rep.total}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-[#6B7280]">
                  {ACTIVITY_TYPE_OPTIONS.map((t) => {
                    const count = rep.byType[t.value] ?? 0;
                    if (count === 0) return null;
                    const Icon = TYPE_ICONS[t.value] ?? ActivityIcon;
                    return (
                      <span key={t.value} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                        <Icon className="h-3 w-3" /> {count} {t.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0F1419]">Activity feed</h2>
              <p className="text-[11px] text-[#8B95A5]">{filtered.length} shown of {activities.length} loaded</p>
            </div>
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {filtered.map((a) => {
                const Icon = TYPE_ICONS[a.activity_type] ?? ActivityIcon;
                return (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="w-36 shrink-0 text-[11px] text-[#8B95A5]">{formatDateTime(a.created_at)}</span>
                    <span className="w-32 shrink-0 truncate text-sm">{a.created_by_profile?.full_name ?? "—"}</span>
                    <span className="w-40 shrink-0 truncate text-sm text-[#6B7280]">
                      {a.contact ? `${a.contact.first_name} ${a.contact.last_name}` : a.account?.company_name ?? "—"}
                    </span>
                    <span className="flex-1 truncate text-sm text-[#6B7280]">{a.outcome ?? a.notes ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
