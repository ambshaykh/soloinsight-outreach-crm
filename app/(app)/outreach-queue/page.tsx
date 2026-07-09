import { requireProfile } from "@/lib/auth/session";
import { getQueueData } from "@/lib/data/queue";
import { PageTransition } from "@/components/shared/page-transition";
import { QueueCard } from "@/components/queue/queue-card";
import { KanbanBoard } from "@/components/queue/kanban-board";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { canManageTeam } from "@/lib/auth/session";
import { Inbox } from "lucide-react";

function Section({ title, description, contacts }: { title: string; description: string; contacts: any[] }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-[#0F1419]">{title}</h3>
        <span className="text-xs text-[#6B7280]">({contacts.length}) — {description}</span>
      </div>
      {contacts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center text-xs text-[#6B7280]">Nothing here right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.slice(0, 9).map((c) => <QueueCard key={c.id} contact={c} />)}
        </div>
      )}
    </div>
  );
}

export default async function OutreachQueuePage({ searchParams }: { searchParams: Record<string, string> }) {
  const profile = await requireProfile();
  const canSeeTeam = canManageTeam(profile.role);
  const scope = (canSeeTeam && searchParams.scope === "team") ? "team" : "mine";
  const data = await getQueueData(profile, scope);

  return (
    <PageTransition>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-[#0F1419]">Outreach Queue</h1>
        <p className="text-sm text-[#6B7280]">Exactly who to contact next, ranked by urgency.</p>
      </div>

      {canSeeTeam && (
        <div className="mb-4 flex gap-2">
          <a href="?scope=mine" className={`rounded-lg px-3 py-1.5 text-sm font-medium ${scope === "mine" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>My Queue</a>
          <a href="?scope=team" className={`rounded-lg px-3 py-1.5 text-sm font-medium ${scope === "team" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>Team Queue</a>
        </div>
      )}

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Queue View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          {data.all.length === 0 ? (
            <EmptyState icon={Inbox} title="Queue is empty" description="No active contacts to work right now." />
          ) : (
            <>
              <Section title="Overdue" description="past their follow-up date" contacts={data.overdue} />
              <Section title="Due Today" description="follow up today" contacts={data.dueToday} />
              <Section title="Hot Prospects" description="urgent priority or positive replies" contacts={data.hot} />
              <Section title="No Touch in 7 Days" description="going quiet" contacts={data.noTouch7} />
              <Section title="No Touch in 14 Days" description="gone cold" contacts={data.noTouch14} />
              <Section title="Called, No Email Yet" description="add an email touch" contacts={data.callNoEmail} />
              <Section title="Emailed, No Call Yet" description="add a call touch" contacts={data.emailNoCall} />
              <Section title="Ready for Second Touch" description="one touch logged so far" contacts={data.readyForSecondTouch} />
              <Section title="Ready for Final Touch" description="3+ touches, time to close it out" contacts={data.readyForFinalTouch} />
            </>
          )}
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanBoard contacts={data.kanban as any} />
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
