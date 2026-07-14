"use client";

import Link from "next/link";
import { LogOut, Settings, UserCircle, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/types/database";

export function AdminTopbar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <span className="text-sm font-semibold text-[#0F1419]">Admin Center</span>

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
            <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
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
    </header>
  );
}
