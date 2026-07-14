"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, ListChecks, CalendarClock,
  Activity, BarChart3, Settings, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "sdr", "executive", "salesforce_admin", "salesforce_viewer"] },
  { href: "/accounts", label: "Accounts", icon: Building2, roles: ["admin", "manager", "sdr", "executive", "salesforce_admin", "salesforce_viewer"] },
  { href: "/contacts", label: "Contacts", icon: Users, roles: ["admin", "manager", "sdr", "executive", "salesforce_admin", "salesforce_viewer"] },
  { href: "/outreach-queue", label: "Outreach Queue", icon: ListChecks, roles: ["admin", "manager", "sdr"] },
  { href: "/follow-ups", label: "Follow Ups", icon: CalendarClock, roles: ["admin", "manager", "sdr"] },
  { href: "/activities", label: "Activities", icon: Activity, roles: ["admin", "manager", "sdr"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "manager", "executive"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "manager", "sdr", "executive", "salesforce_admin", "salesforce_viewer"] },
] as const;

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-white/5 bg-cg-navy1 lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo className="text-white" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.filter((item) => (item.roles as readonly string[]).includes(role)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-to-r from-[#2563EB]/90 to-[#1D4ED8]/90 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>
      <div className="mx-3 mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-[11px] font-medium text-white/70">Manual outreach only</p>
        <p className="mt-0.5 text-[10px] text-white/40">
          No autodialer. No auto-send. Every touch is logged by a human.
        </p>
      </div>
    </aside>
  );
}
