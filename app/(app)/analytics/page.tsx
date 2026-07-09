import { requireRole } from "@/lib/auth/session";
import { getAnalyticsData } from "@/lib/data/analytics";
import { PageTransition } from "@/components/shared/page-transition";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ActivityByDayChart, ActivityByChannelChart, PipelineMovementChart } from "@/components/analytics/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Mail, Phone, TrendingUp, Users, CalendarCheck, CheckCircle2, Snowflake, Activity } from "lucide-react";

export default async function AnalyticsPage() {
  await requireRole(["admin", "manager"]);
  const { summary, perUser, activityByDay, activityByChannel, pipelineByWeek } = await getAnalyticsData();

  return (
    <PageTransition>
      <div className="mb-6 rounded-2xl bg-cg-hero p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-cg-accentLight">Sales Operations Control Center</p>
        <h1 className="mt-1 text-2xl font-semibold">Activities &amp; Analytics</h1>
        <p className="mt-1 text-sm text-white/60">60-day view of manual outreach performance across the team.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <MetricCard index={0} label="Total Activities" value={summary.totalActivities} icon={Activity} accent="blue" />
        <MetricCard index={1} label="Emails Sent" value={summary.emailCount} icon={Mail} accent="blue" />
        <MetricCard index={2} label="Calls Made" value={summary.callCount} icon={Phone} accent="blue" />
        <MetricCard index={3} label="Reply Rate" value={`${summary.replyRate}%`} icon={TrendingUp} accent="emerald" />
        <MetricCard index={4} label="Touches / Prospect" value={summary.touchesPerProspect} icon={Users} accent="violet" />
        <MetricCard index={5} label="Follow Ups Done" value={summary.completedFollowUps} icon={CheckCircle2} accent="emerald" />
        <MetricCard index={6} label="Meetings Booked" value={summary.meetingsBooked} icon={CalendarCheck} accent="amber" />
        <MetricCard index={7} label="Stale Prospects" value={summary.staleProspects} icon={Snowflake} accent="rose" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Activity by Day (30d)</CardTitle></CardHeader>
          <CardContent><ActivityByDayChart data={activityByDay} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Activity by Channel</CardTitle></CardHeader>
          <CardContent><ActivityByChannelChart data={activityByChannel} /></CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Pipeline Movement by Week</CardTitle></CardHeader>
          <CardContent><PipelineMovementChart data={pipelineByWeek} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Team Performance</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rep</TableHead>
                  <TableHead>Emails</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>LinkedIn</TableHead>
                  <TableHead>Meetings</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perUser.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.emails}</TableCell>
                    <TableCell>{u.calls}</TableCell>
                    <TableCell>{u.linkedin}</TableCell>
                    <TableCell>{u.meetings}</TableCell>
                    <TableCell className="font-semibold">{u.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
