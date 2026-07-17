import Link from "next/link";
import { ArrowLeft, Trophy, Mail, Phone, Calendar, MessageSquareReply, ListChecks } from "lucide-react";
import { getTeamLeaderboard } from "@/lib/data/executive";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/constants";
import { initials, cn } from "@/lib/utils";

const MEDAL_STYLES = [
  "bg-gradient-to-br from-amber-300 to-amber-500 text-white",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white",
  "bg-gradient-to-br from-orange-300 to-orange-500 text-white",
];

export default async function TeamLeaderboardPage() {
  const rows = await getTeamLeaderboard();
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div>
      <Link href="/executive" className="mb-4 flex w-fit items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#0F1419]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-[#0F1419]">Team Leaderboard</h1>
          <p className="text-sm text-[#6B7280]">
            Outreach volume (60 days), reply rate, and follow-up discipline — every number here is computed
            directly from logged activities and tasks, nothing estimated.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-[#6B7280]">No rep activity recorded yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <Card key={r.id} className="hover:-translate-y-0">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                  {i < 3 ? (
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm", MEDAL_STYLES[i])}>
                      {i + 1}
                    </span>
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                      {i + 1}
                    </span>
                  )}
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(r.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0F1419]">{r.name}</p>
                    <p className="text-[11px] text-[#8B95A5]">{ROLE_LABELS[r.role as keyof typeof ROLE_LABELS] ?? r.role}</p>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${Math.round((r.total / maxTotal) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#6B7280] sm:grid-cols-5">
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {r.emails} emails</span>
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {r.calls} calls</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {r.meetings} meetings</span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquareReply className="h-3.5 w-3.5" /> {r.replyRate !== null ? `${r.replyRate}% reply rate` : "No emails yet"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5" />
                      {r.completionRate !== null ? `${r.completionRate}% follow-ups on time` : "No tasks yet"}
                      {r.overdueTasks > 0 && <span className="text-amber-600">({r.overdueTasks} overdue)</span>}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:w-20 sm:shrink-0">
                  <p className="text-xl font-semibold text-[#0F1419]">{r.total}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[#8B95A5]">Total touches</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
