"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportAccountsCsv, exportContactsCsv, importContactsCsv } from "@/app/actions/data";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function DataImportExport() {
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        const result = await importContactsCsv(String(reader.result));
        if (result.error) toast.error(result.error.slice(0, 200));
        toast.success(`Imported ${result.imported} contacts`);
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Button variant="secondary" onClick={() => startTransition(async () => download("accounts.csv", await exportAccountsCsv()))} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export Accounts CSV
      </Button>
      <Button variant="secondary" onClick={() => startTransition(async () => download("contacts.csv", await exportContactsCsv()))} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export Contacts CSV
      </Button>
      <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={isPending}>
        <Upload className="h-4 w-4" /> Import Contacts CSV
      </Button>
      <input
        ref={fileRef} type="file" accept=".csv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }}
      />
      <p className="col-span-full text-[11px] text-[#6B7280]">
        Import expects columns: first_name, last_name, title, email, phone. Imported contacts are assigned to you.
      </p>
    </div>
  );
}
