"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Trophy, ChevronRight, ArrowLeftRight } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import { portalsForRole } from "@/lib/auth/portals";

const NAV_ITEMS = [
  { href: "/executive", label: "Overview", icon: LayoutGrid },
  { href: "/executive/leaderboard", label: "Team Leaderboard", icon: Trophy },
] as const;

export function ExecutiveSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const hasMultiplePortals = portalsForRole(role).length > 1;

  return (
    <aside className="hidden w-64 flex-col border-r border-white/5 bg-[#1a0b2e] print:hidden lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo className="text-white" />
      </div>
      <div className="px-6 pb-2">
        <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
          Executive Dashboard
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 text-white shadow-sm"
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

      {hasMultiplePortals && (
        <Link
          href="/"
          className="mx-3 mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" /> Switch portal
        </Link>
      )}
    </aside>
  );
}
