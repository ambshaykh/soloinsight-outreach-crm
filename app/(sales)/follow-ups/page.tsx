import { requireProfile, canManageTeam } from "@/lib/auth/session";
import { listTasks } from "@/lib/data/tasks";
import { PageTransition } from "@/components/shared/page-transition";
import { FollowUpRow } from "@/components/shared/follow-up-row";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarClock } from "lucide-react";
import { isOverdue } from "@/lib/utils";

export default async function FollowUpsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const profile = await requireProfile();
  const canSeeTeam = canManageTeam(profile.role);
  const scope = (canSeeTeam && searchParams.scope === "team") ? "team" : "mine";

  const tasks = await listTasks(scope === "mine" ? { assignedTo: profile.id } : {});
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 86400000);

  const overdue = tasks.filter((t) => t.status === "open" && isOverdue(t.due_date) && new Date(t.due_date) < startOfToday);
  const dueToday = tasks.filter((t) => t.status === "open" && new Date(t.due_date) >= startOfToday && new Date(t.due_date) < endOfToday);
  const upcoming = tasks.filter((t) => t.status === "open" && new Date(t.due_date) >= endOfToday);
  const done = tasks.filter((t) => t.status !== "open").slice(0, 15);

  return (
    <PageTransition>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-[#0F1419]">Follow-Up Center</h1>
        <p className="text-sm text-[#6B7280]">Every scheduled follow-up, prioritized by due date.</p>
      </div>

      {canSeeTeam && (
        <div className="mb-4 flex gap-2">
          <a href="?scope=mine" className={`rounded-lg px-3 py-1.5 text-sm font-medium ${scope === "mine" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>My Follow Ups</a>
          <a href="?scope=team" className={`rounded-lg px-3 py-1.5 text-sm font-medium ${scope === "team" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>Team Follow Ups</a>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No follow-ups scheduled" />
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-rose-600">Overdue ({overdue.length})</h3>
            <div className="space-y-2">{overdue.map((t) => <FollowUpRow key={t.id} task={t} />)}</div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#0F1419]">Due Today ({dueToday.length})</h3>
            <div className="space-y-2">{dueToday.map((t) => <FollowUpRow key={t.id} task={t} />)}</div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#0F1419]">Upcoming ({upcoming.length})</h3>
            <div className="space-y-2">{upcoming.slice(0, 20).map((t) => <FollowUpRow key={t.id} task={t} />)}</div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#6B7280]">Recently Resolved</h3>
            <div className="space-y-2">{done.map((t) => <FollowUpRow key={t.id} task={t} />)}</div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
