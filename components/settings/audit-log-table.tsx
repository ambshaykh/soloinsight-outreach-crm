"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptySearchState } from "@/components/shared/state-patterns";
import { formatDateTime } from "@/lib/utils";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: { full_name: string; email: string } | null;
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

function toCsv(rows: AuditLog[]): string {
  const columns = ["created_at", "user", "action", "entity_type", "entity_id", "metadata"];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(",")];
  for (const r of rows) {
    lines.push(
      [r.created_at, r.user?.full_name ?? "System", r.action, r.entity_type ?? "", r.entity_id ?? "", JSON.stringify(r.metadata)]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}

/** Renders a compact before -> after diff when metadata has that shape, or a raw JSON dump otherwise. */
function MetadataDiff({ metadata }: { metadata: Record<string, unknown> }) {
  const keys = Object.keys(metadata ?? {});
  if (keys.length === 0) return <p className="text-xs text-[#8B95A5]">No additional detail.</p>;

  if ("before" in metadata || "after" in metadata) {
    const rest = Object.fromEntries(Object.entries(metadata).filter(([k]) => !["before", "after"].includes(k)));
    return (
      <div className="space-y-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-rose-50 px-2 py-1 font-mono text-rose-700">
            {JSON.stringify((metadata as any).before) ?? "null"}
          </span>
          <span className="text-[#8B95A5]">→</span>
          <span className="rounded-md bg-emerald-50 px-2 py-1 font-mono text-emerald-700">
            {JSON.stringify((metadata as any).after) ?? "null"}
          </span>
        </div>
        {Object.keys(rest).length > 0 && (
          <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 font-mono text-[11px] text-[#6B7280]">{JSON.stringify(rest, null, 2)}</pre>
        )}
      </div>
    );
  }

  return <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 font-mono text-[11px] text-[#6B7280]">{JSON.stringify(metadata, null, 2)}</pre>;
}

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  const [actorFilter, setActorFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionSearch, setActionSearch] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const actors = useMemo(() => {
    const names = new Set(logs.map((l) => l.user?.full_name).filter(Boolean) as string[]);
    return Array.from(names).sort();
  }, [logs]);

  const entityTypes = useMemo(() => {
    const types = new Set(logs.map((l) => l.entity_type).filter(Boolean) as string[]);
    return Array.from(types).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const cutoff = { "24h": 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000 }[dateRange as "24h" | "7d" | "30d"];
    return logs.filter((l) => {
      if (actorFilter !== "all" && l.user?.full_name !== actorFilter) return false;
      if (entityFilter !== "all" && l.entity_type !== entityFilter) return false;
      if (actionSearch && !l.action.toLowerCase().includes(actionSearch.toLowerCase())) return false;
      if (cutoff && Date.now() - new Date(l.created_at).getTime() > cutoff) return false;
      return true;
    });
  }, [logs, actorFilter, entityFilter, actionSearch, dateRange]);

  function clearFilters() {
    setActorFilter("all"); setEntityFilter("all"); setActionSearch(""); setDateRange("all");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={actionSearch}
          onChange={(e) => setActionSearch(e.target.value)}
          placeholder="Search action…"
          className="h-8 w-44 text-xs"
        />
        <Select value={actorFilter} onValueChange={setActorFilter}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Actor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actors</SelectItem>
            {actors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityTypes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="secondary" className="ml-auto" onClick={() => download("audit-log.csv", toCsv(filtered))}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <p className="text-[11px] text-[#8B95A5]">{filtered.length} shown of {logs.length} loaded (most recent 500) · sorted newest first</p>

      {filtered.length === 0 ? (
        <EmptySearchState onClearFilters={clearFilters} />
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {filtered.map((log) => {
            const isOpen = expanded === log.id;
            return (
              <div key={log.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#8B95A5]" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8B95A5]" />}
                  <span className="w-36 shrink-0 text-[11px] text-[#8B95A5]">{formatDateTime(log.created_at)}</span>
                  <span className="w-32 shrink-0 truncate text-sm">{log.user?.full_name ?? "System"}</span>
                  <span className="flex-1 truncate text-sm font-medium text-[#0F1419]">{log.action}</span>
                  {log.entity_type && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-[#6B7280]">{log.entity_type}</span>}
                </button>
                {isOpen && (
                  <div className="border-t border-slate-50 bg-slate-50/50 px-3 py-3 pl-9">
                    <MetadataDiff metadata={log.metadata} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
