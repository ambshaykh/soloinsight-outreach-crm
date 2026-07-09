import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import type { PriorityLevel } from "@/lib/types/database";
import { Flame } from "lucide-react";

export function PriorityBadge({ priority, className }: { priority: PriorityLevel; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", PRIORITY_COLORS[priority], className)}>
      {priority === "urgent" && <Flame className="h-3 w-3" />}
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
