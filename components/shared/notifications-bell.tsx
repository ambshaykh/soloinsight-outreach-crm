"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications";
import { cn, formatRelativeDate } from "@/lib/utils";

type NotificationRow = {
  id: string;
  event_key: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/**
 * The one notification bell shared across all 4 portals — dropped into
 * Topbar, AdminTopbar, and the simpler Executive/Salesforce headers. Data is
 * fetched server-side by the portal's layout.tsx and passed in as props;
 * this component just renders it and calls the mark-read actions.
 */
export function NotificationsBell({
  initialNotifications, initialUnreadCount, className,
}: { initialNotifications: NotificationRow[]; initialUnreadCount: number; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  function handleOpenItem(n: NotificationRow) {
    if (!n.read_at) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      startTransition(async () => { await markNotificationRead(n.id); router.refresh(); });
    }
    setOpen(false);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    startTransition(async () => { await markAllNotificationsRead(); router.refresh(); });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn("relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100", className)}>
          <Bell className="h-4.5 w-4.5 text-[#0F1419]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <p className="text-sm font-semibold text-[#0F1419]">Notifications</p>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-[#8B95A5]">You're all caught up.</p>
          ) : (
            notifications.map((n) => {
              const item = (
                <div
                  key={n.id}
                  className={cn(
                    "flex flex-col gap-0.5 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50",
                    !n.read_at && "bg-violet-50/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[#0F1419]">{n.title}</p>
                    {!n.read_at && <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {n.body && <p className="text-[11px] text-[#6B7280]">{n.body}</p>}
                  <p className="text-[10px] text-[#8B95A5]">{formatRelativeDate(n.created_at)}</p>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => handleOpenItem(n)}>{item}</Link>
              ) : (
                <button key={n.id} onClick={() => handleOpenItem(n)} className="block w-full">{item}</button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
