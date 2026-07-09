"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { formatRelativeDate, isOverdue } from "@/lib/utils";
import { completeTask, snoozeTask } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";

export function FollowUpRow({ task }: { task: any }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const overdue = task.status === "open" && isOverdue(task.due_date);

  function run(promise: Promise<{ error: string | null }>, msg: string) {
    startTransition(async () => {
      const r = await promise;
      if (r.error) toast.error(r.error); else { toast.success(msg); router.refresh(); }
    });
  }

  return (
    <div className={cn("flex items-center justify-between rounded-lg border px-4 py-3", overdue ? "border-rose-200 bg-rose-50/40" : "border-slate-100 bg-white")}>
      <div>
        <p className="text-sm font-medium text-[#0F1419]">{task.title}</p>
        <p className="text-xs text-[#6B7280]">
          {task.contact ? (
            <Link href={`/contacts/${task.contact.id}`} className="hover:underline">
              {task.contact.first_name} {task.contact.last_name}
            </Link>
          ) : "—"}
          {task.contact?.account?.company_name ? ` · ${task.contact.account.company_name}` : ""}
          {" · "}{formatRelativeDate(task.due_date)}
          {task.assignee?.full_name ? ` · ${task.assignee.full_name}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {task.status === "open" && (
          <>
            <Button size="sm" variant="ghost" onClick={() => run(snoozeTask(task.id, 3), "Snoozed 3 days")}>
              <Clock3 className="h-3.5 w-3.5" /> Snooze
            </Button>
            <Button size="sm" variant="secondary" onClick={() => run(completeTask(task.id), "Marked complete")}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </Button>
          </>
        )}
        {task.status !== "open" && <span className="text-xs capitalize text-[#6B7280]">{task.status}</span>}
      </div>
    </div>
  );
}
