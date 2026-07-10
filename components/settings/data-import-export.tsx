"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportAccountsCsv, exportContactsCsv, importAccountsCsv, importContactsCsv,
  accountCsvTemplate, contactCsvTemplate,
} from "@/app/actions/data";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function DataImportExport() {
  const [busy, setBusy] = useState<string | null>(null);
  const accountsFileRef = useRef<HTMLInputElement>(null);
  const contactsFileRef = useRef<HTMLInputElement>(null);

  function withBusy(key: string, fn: () => Promise<void>) {
    setBusy(key);
    fn().finally(() => setBusy(null));
  }

  function handleAccountsImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      withBusy("import-accounts", async () => {
        const result = await importAccountsCsv(String(reader.result));
        if (result.error) toast.error(result.error.slice(0, 300));
        if (result.imported || result.updated) {
          toast.success(`Accounts: ${result.imported} added, ${result.updated} updated`);
        } else if (!result.error) {
          toast.error("No rows were imported — check your CSV columns.");
        }
      });
    };
    reader.readAsText(file);
  }

  function handleContactsImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      withBusy("import-contacts", async () => {
        const result = await importContactsCsv(String(reader.result));
        if (result.error) toast.error(result.error.slice(0, 300));
        if (result.imported || result.updated) {
          toast.success(`Contacts: ${result.imported} added, ${result.updated} updated`);
        } else if (!result.error) {
          toast.error("No rows were imported — check your CSV columns.");
        }
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase 