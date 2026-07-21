import { requireProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { getBounceWidgetSummary } from "@/lib/data/bounces";
import { PageTransition } from "@/components/shared/page-transition";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  DailyActivityChart, EmailVsCallChart, PipelineByStatusChart, OwnerPerformanceChart,
} from "@/components/dashboard/charts";
import {
  TodaysFollowUpsWidget, RecentlyTouchedWidget, NeedsAttentionWidget,
} from "@/components/dashboard/widgets";
import { BounceMonitorWidget } from "@/components/dashboard/bounce-monitor-widget";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ACCOUNT_STATUS_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [{ metrics, charts, widgets }, bounceSummary] = await Promise.all([
    getDashboardData(profile),
    getBounceWidgetSummary(),
  ]);

  const pipelineData = charts.pipelineByStatus.map((p) => ({
    status: ACCOUNT_STATUS_LABELS[p.status as keyof typeof ACCOUNT_STATUS_LABELS] ?? p.status,
    count: p.count,
  }));

  return (
    <PageTransition>
      {/* Dark hero header */}
      <div className="hero-gradient-animated relative mb-6 overflow-hidden rounded-2xl px-8 py-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(91,156,255,0.25),transparent_50%)]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cg-accentLight">Command Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold">Welcome back, {profile.full_name.split(" ")[0]}</h1>
            <p className="mt-1 text-sm text-white/60">Here's how manual outreach is trending across the team.</p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-2xl font-semibold">{metrics.emailsToday + metrics.callsToday}</p>
              <p className="text-xs text-white/50">Touches today</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{metrics.followUpsDueToday}</p>
              <p className="text-xs text-white/50">Due today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <MetricCard index={0} label="Total Prospects" value={metrics.totalProspects} icon="users" accent="blue" />
        <MetricCard index={1} label="Accounts In Progress" value={metrics.accountsInProgress} icon="building2" accent="violet" />
        <MetricCard index={2} label="Emails Today" value={metrics.emailsToday} icon="mail" accent="blue" />
        <MetricCard index={3} label="Calls Today" value={metrics.callsToday} icon="phone" accent="blue" />
        <MetricCard index={4} label="Follow Ups Due" value={metrics.followUpsDueToday} icon="calendarClock" accent="amber" />
        <MetricCard index={5} label="Meetings Booked" value={metrics.meetingsBooked} icon="checkCircle2" accent="emerald" />
        <MetricCard index={6} label="Hot Prospects" value={metrics.hotProspects} icon="flame" accent="rose" />
        <MetricCard index={7} label="Stale Prospects" value={metrics.staleProspects} icon="snowflake" accent="amber" />
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Daily Outreach Activity</CardTitle></CardHeader>
          <CardContent><DailyActivityChart data={charts.dailyActivity} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Email vs Call Activity</CardTitle></CardHeader>
          <CardContent><EmailVsCallChart data={charts.emailVsCall} /></CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Pipeline by Status</CardTitle></CardHeader>
          <CardContent><PipelineByStatusChart data={pipelineData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Owner Performance</CardTitle></CardHeader>
          <CardContent><OwnerPerformanceChart data={charts.ownerPerformance} /></CardContent>
        </Card>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TodaysFollowUpsWidget tasks={widgets.todaysFollowUps as any} />
        <RecentlyTouchedWidget contacts={widgets.recentlyTouched as any} />
        <NeedsAttentionWidget contacts={widgets.needsAttention as any} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BounceMonitorWidget summary={bounceSummary} />
      </div>
    </PageTransition>
  );
}
