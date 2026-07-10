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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Accounts</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => withBusy("export-accounts", async () => download("accounts.csv", await exportAccountsCsv()))}
            disabled={busy !== null}
          >
            {busy === "export-accounts" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export
          </Button>
          <Button variant="outline" onClick={() => accountsFileRef.current?.click()} disabled={busy !== null}>
            {busy === "import-accounts" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
          </Button>
          <Button
            variant="ghost"
            onClick={() => withBusy("template-accounts", async () => download("accounts-template.csv", await accountCsvTemplate()))}
            disabled={busy !== null}
          >
            <FileText className="h-4 w-4" /> Download template
          </Button>
          <input
            ref={accountsFileRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAccountsImport(f); e.target.value = ""; }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#6B7280]">
          Columns: company_name, domain, industry, region, company_size, source, status, priority, icp_score, notes.
          Matches existing accounts by domain or company name and updates them; everything else is created new.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contacts</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => withBusy("export-contacts", async () => download("contacts.csv", await exportContactsCsv()))}
            disabled={busy !== null}
          >
            {busy === "export-contacts" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export
          </Button>
          <Button variant="outline" onClick={() => contactsFileRef.current?.click()} disabled={busy !== null}>
            {busy === "import-contacts" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
          </Button>
          <Button
            variant="ghost"
            onClick={() => withBusy("template-contacts", async () => download("contacts-template.csv", await contactCsvTemplate()))}
            disabled={busy !== null}
          >
            <FileText className="h-4 w-4" /> Download template
          </Button>
          <input
            ref={contactsFileRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleContactsImport(f); e.target.value = ""; }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#6B7280]">
          Columns: company_name, first_name, last_name, title, email, phone, linkedin_url, status, priority, notes.
          If company_name doesn't match an existing account, a new one is created automatically. Matches existing
          contacts by email and updates them; everything else is created new and assigned to you.
        </p>
      </div>
    </div>
  );
}
