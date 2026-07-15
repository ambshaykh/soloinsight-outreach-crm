"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileQuestion, ServerCrash, ShieldAlert, WifiOff, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Canonical error / empty state set, reused across all 4 portals so a 404,
 * a permission error, or an empty filtered table always looks and behaves
 * the same way. Every state keeps the caller's own shell (sidebar/topbar)
 * intact — these are meant to render inside `<main>`, not take over the
 * whole page, mirroring how the admin-panel reference kept its rail visible
 * during in-shell errors.
 */

function Frame({
  icon: Icon,
  tone,
  title,
  description,
  action,
}: {
  icon: typeof FileQuestion;
  tone: "slate" | "rose" | "amber";
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-500",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  }[tone];

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${toneClasses}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[#0F1419]">{title}</p>
        <p className="max-w-sm text-xs text-[#6B7280]">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** 404 — route not found. Use as the body of a portal's not-found.tsx. */
export function NotFoundState({ backHref = "/" }: { backHref?: string }) {
  return (
    <Frame
      icon={FileQuestion}
      tone="slate"
      title="That page doesn't exist"
      description="You followed a stale link or bookmark. Check the URL, or head back to somewhere that does."
      action={<Link href={backHref}><Button variant="secondary" size="sm">Back to dashboard</Button></Link>}
    />
  );
}

/** 500 — unexpected error. Use as the body of a portal's error.tsx. */
export function ServerErrorState({ onRetry, requestId }: { onRetry?: () => void; requestId?: string }) {
  return (
    <Frame
      icon={ServerCrash}
      tone="rose"
      title="Something broke"
      description="The server hit an unexpected error. Try again, or reload the page."
      action={
        <div className="flex flex-col items-center gap-1.5">
          {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
          {requestId && <p className="text-[10px] text-[#8B95A5]">request_id: {requestId}</p>}
        </div>
      }
    />
  );
}

/** 403 — role doesn't grant this capability. */
export function PermissionDeniedState({ rolesHref = "/admin/roles" }: { rolesHref?: string }) {
  return (
    <Frame
      icon={ShieldAlert}
      tone="amber"
      title="You can't do this"
      description="Your role doesn't grant this capability. Ask an admin to check the Roles & Permissions matrix."
      action={<Link href={rolesHref}><Button variant="secondary" size="sm">Open Roles &amp; Permissions</Button></Link>}
    />
  );
}

/** Offline — client-side network state, auto re-checks. */
export function OfflineState() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (online) return null;
  return (
    <Frame
      icon={WifiOff}
      tone="rose"
      title="You're offline"
      description="We can't reach the server right now. Your most recent data may be stale until the connection comes back."
    />
  );
}

/** Empty search / filtered-to-nothing results. */
export function EmptySearchState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <Frame
      icon={SearchX}
      tone="slate"
      title="No matches for that search"
      description="Try a shorter query, or clear the active filters to widen the results."
      action={onClearFilters && <Button variant="secondary" size="sm" onClick={onClearFilters}>Clear filters</Button>}
    />
  );
}
