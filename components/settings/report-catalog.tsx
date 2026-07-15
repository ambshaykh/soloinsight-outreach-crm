"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runReport } from "@/app/actions/reports";
import type { ReportKey } from "@/lib/reports/catalog";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ReportCatalog({
  reports,
}: { reports: { key: ReportKey; label: string; description: string; domain: string; source: string }[] }) {
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);

  async function handleRun(key: ReportKey, filenameHint: string) {
    setRunning(key);
    const r = await runReport(key);
    setRunning(null);
    if (r.error) { toast.error(r.error); return; }
    if (r.csv) download(r.filename ?? `${filenameHint}.csv`, r.csv);
    toast.success(`${r.rowCount ?? 0} rows exported`);
    router.refresh();
  }

  const domains = Array.from(new Set(reports.map((r) => r.domain)));

  return (
    <div className="space-y-5">
      {domains.map((domain) => (
        <div key={domain}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B95A5]">{domain}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reports.filter((r) => r.domain === domain).map((r) => (
              <div key={r.key} className="flex flex-col justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0F1419]">{r.label}</p>
                    <Badge variant="outline">CSV</Badge>
                  </div>
                  <p className="text-xs text-[#6B7280]">{r.description}</p>
                  <p className="mt-1 text-[10px] text-[#8B95A5]">Sourced from {r.source}</p>
                </div>
                <Button size="sm" variant="secondary" className="mt-3 w-fit" disabled={running !== null} onClick={() => handleRun(r.key, r.key)}>
                  {running === r.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Run now
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
