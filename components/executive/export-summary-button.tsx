"use client";

import { useState } from "react";
import { Download, Printer, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Kpis = {
  totalProspects: number; accountsInProgress: number; meetingsBooked: number;
  hotProspects: number; staleProspects: number; replyRate: number; last7DayActivity: number;
};
type LeaderboardRow = { name: string; emails: number; calls: number; meetings: number; total: number; replyRate: number | null; completionRate: number | null };

function csvEscape(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/**
 * Phase 7 — one-click executive summary export. Two formats, both built
 * client-side from data already on the page (no extra query, no new
 * dependency): a CSV of the real KPI + leaderboard numbers, and a
 * print-to-PDF using the browser's own print dialog with a print-only
 * stylesheet that hides the sidebar/topbar (see globals.css / print:hidden).
 */
export function ExportSummaryButton({ kpis, leaderboard }: { kpis: Kpis; leaderboard: LeaderboardRow[] }) {
  const [open, setOpen] = useState(false);

  function exportCsv() {
    const today = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    lines.push("Executive Summary", `Generated,${today}`, "");
    lines.push("KPI,Value");
    lines.push(`Accounts in progress,${kpis.accountsInProgress}`);
    lines.push(`Meetings booked,${kpis.meetingsBooked}`);
    lines.push(`Hot prospects,${kpis.hotProspects}`);
    lines.push(`Reply rate,${kpis.replyRate}%`);
    lines.push(`Stale prospects (14d+),${kpis.staleProspects}`);
    lines.push(`Outreach last 7 days,${kpis.last7DayActivity}`);
    lines.push("");
    lines.push("Rep,Emails,Calls,Meetings,Reply rate,Follow-up completion,Total");
    for (const r of leaderboard) {
      lines.push([
        csvEscape(r.name), r.emails, r.calls, r.meetings,
        r.replyRate !== null ? `${r.replyRate}%` : "—",
        r.completionRate !== null ? `${r.completionRate}%` : "—",
        r.total,
      ].join(","));
    }
    download(`executive-summary-${today}.csv`, lines.join("\n"));
    setOpen(false);
  }

  function exportPdf() {
    setOpen(false);
    // Give the dropdown a beat to close before the print dialog steals focus.
    setTimeout(() => window.print(), 50);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="secondary" className="print:hidden">
          <Download className="h-4 w-4" /> Export summary <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={exportCsv}>
          <Download className="h-4 w-4" /> Download as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={exportPdf}>
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
