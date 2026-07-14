"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Mail, Phone, Plus, LogOut, Settings, UserCircle, ChevronDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { LogActivityModal } from "@/components/activities/log-activity-modal";
import { DataImportExport } from "@/components/settings/data-import-export";
import { initials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/types/database";

export function Topbar({ profile }: { profile: Profile }) {
  const [logType, setLogType] = useState<"email" | "call" | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search accounts, contacts…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = (e.target as HTMLInputElement).value;
                window.location.href = `/contacts?search=${encodeURIComponent(q)}`;
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setLogType("email")}>
          <Mail className="h-4 w-4" /> Log Email
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setLogType("call")}>
          <Phone className="h-4 w-4" /> Log Call
        </Button>

        <Button size="sm" variant="secondary" onClick={() => setDataDialogOpen(true)}>
          <FileSpreadsheet className="h-4 w-4" /> Import/Export
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> Quick Add <ChevronDown className="h-3 w-3" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setAddAccountOpen(true)}>Add Account</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAddContactOpen(true)}>Add Contact</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-2 hidden lg:block">
          <SecurityStatusBadge enabled={profile.two_factor_enabled} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left lg:block">
                <p className="text-xs font-semibold leading-tight text-[#0F1419]">{profile.full_name}</p>
                <p className="text-[10px] text-[#6B7280]">{ROLE_LABELS[profile.role]}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{profile.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account"><UserCircle className="h-4 w-4" /> Profile settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/security"><Settings className="h-4 w-4" /> Security</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOut} className="w-full">
              <button type="submit" className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-rose-600 hover:bg-rose-50">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LogActivityModal open={logType !== null} onOpenChange={(o) => !o && setLogType(null)} defaultType={logType ?? "email"} />
      <AccountFormDialog trigger={null} open={addAccountOpen} onOpenChange={setAddAccountOpen} />
      <ContactFormDialog trigger={null} open={addContactOpen} onOpenChange={setAddContactOpen} />

      <Dialog open={dataDialogOpen} onOpenChange={setDataDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import / Export data</DialogTitle>
            <DialogDescription>Export your pipeline, or bulk-import accounts and contacts from CSV.</DialogDescription>
          </DialogHeader>
          <DataImportExport />
        </DialogContent>
      </Dialog>
    </header>
  );
}
