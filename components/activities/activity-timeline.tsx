import { Mail, Phone, Linkedin, StickyNote, CalendarCheck, ArrowRightLeft, UserCog, CalendarClock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import type { ActivityType } from "@/lib/types/database";

const ICONS: Record<ActivityType, any> = {
  email: Mail, call: Phone, linkedin: Linkedin, note: StickyNote, meeting: CalendarCheck,
  status_change: ArrowRightLeft, owner_assignment: UserCog, follow_up: CalendarClock,
};

const COLORS: Record<ActivityType, string> = {
  email: "bg-blue-50 text-blue-600", call: "bg-cyan-50 text-cyan-600", linkedin: "bg-violet-50 text-violet-600",
  note: "bg-slate-100 text-slate-600", meeting: "bg-emerald-50 text-emerald-600",
  status_change: "bg-amber-50 text-amber-600", owner_assignment: "bg-indigo-50 text-indigo-600",
  follow_up: "bg-rose-50 text-rose-600",
};

export function ActivityTimeline({ activities }: { activities: any[] }) {
  if (activities.length === 0) {
    return <EmptyState icon={StickyNote} title="No activity logged yet" description="Manual emails, calls, and notes will show up here." />;
  }

  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-6">
      {activities.map((a) => {
        const Icon = ICONS[a.activity_type as ActivityType] ?? StickyNote;
        return (
          <li key={a.id} className="relative">
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ${COLORS[a.activity_type as ActivityType]}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#0F1419] capitalize">
                  {a.activity_type} {a.subject ? `— ${a.subject}` : ""}
                </p>
                <span className="text-[11px] text-[#6B7280]">{formatDateTime(a.created_at)}</span>
              </div>
              {a.notes && <p className="mt-1 text-xs text-[#6B7280]">{a.notes}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#6B7280]">
                {a.outcome && <span className="rounded-full bg-slate-100 px-2 py-0.5">{a.outcome}</span>}
                {a.created_by_profile?.full_name && <span>by {a.created_by_profile.full_name}</span>}
                {a.contact && <span>· {a.contact.first_name} {a.contact.last_name}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
