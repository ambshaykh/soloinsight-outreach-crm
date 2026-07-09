import { ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function SecurityStatusBadge({ enabled, className }: { enabled: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200",
        className
      )}
    >
      {enabled ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
      {enabled ? "2FA Enabled" : "2FA Required"}
    </span>
  );
}
