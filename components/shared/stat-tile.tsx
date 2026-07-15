import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small KPI tile — value, label, optional icon and optional delta vs a prior
 * period. Inspired by the stat-tile pattern from the admin-panel reference
 * (kpi-tile), redone in our own brand colors. Used across the Executive
 * Dashboard, Reports catalog, and Admin Users pages for consistent "at a
 * glance" numbers.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  sublabel,
  delta,
  deltaLabel,
  tone = "primary",
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  /** Positive = up (good by default), negative = down. Omit to hide the delta pill. */
  delta?: number;
  deltaLabel?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-blue-50 text-primary",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
    neutral: "bg-slate-100 text-slate-600",
  };

  const hasDelta = typeof delta === "number" && !Number.isNaN(delta);
  const deltaUp = hasDelta && (delta as number) > 0;
  const deltaFlat = hasDelta && delta === 0;

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B95A5]">{label}</p>
        {Icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", toneClasses[tone])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-[#0F1419]">{value}</p>
        {hasDelta && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              deltaFlat ? "bg-slate-100 text-slate-500" : deltaUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}
          >
            {!deltaFlat && (deltaUp ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />)}
            {Math.abs(delta as number)}{deltaLabel ?? ""}
          </span>
        )}
      </div>
      {sublabel && <p className="mt-0.5 text-[11px] text-[#8B95A5]">{sublabel}</p>}
    </div>
  );
}
