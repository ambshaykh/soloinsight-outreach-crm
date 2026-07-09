"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeDate } from "@/lib/utils";
import { completeTask, snoozeTask } from "@/app/actions/tasks";
import type { Task } from "@/lib/types/database";

export function TaskMiniList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (tasks.length === 0) {
    return <EmptyState icon={Clock3} title="No follow ups scheduled" />;
  }

  function handleComplete(id: string) {
    startTransition(async () => {
      const r = await completeTask(id);
      if (r.error) toast.error(r.error); else { toast.success("Marked complete"); router.refresh(); }
    });
  }

  function handleSnooze(id: string) {
    startTransition(async () => {
      const r = await snoozeTask(id, 3);
      if (r.error) toast.error(r.error); else { toast.success("Snoozed 3 days"); router.refresh(); }
    });
  }

  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
          <div>
            <p className={`text-sm font-medium ${t.status === "completed" ? "text-slate-400 line-through" : "text-[#0F1419]"}`}>{t.title}</p>
            <p className="text-xs text-[#6B7280]">{formatRelativeDate(t.due_date)} <PriorityBadge priority={t.priority} className="ml-2" /></p>
          </div>
          {t.status === "open" && (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => handleSnooze(t.id)}>Snooze</Button>
              <Button size="sm" variant="secondary" onClick={() => handleComplete(t.id)}><CheckCircle2 className="h-3.5 w-3.5" /> Done</Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
