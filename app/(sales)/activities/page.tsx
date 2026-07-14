import { Suspense } from "react";
import { requireProfile, canManageTeam } from "@/lib/auth/session";
import { listActivities } from "@/lib/data/activities";
import { listProfiles } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { ActivitiesFilterBar } from "@/components/activities/activities-filter-bar";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default async function ActivitiesPage({ searchParams }: { searchParams: Record<string, string> }) {
  const profile = await requireProfile();
  const canSeeTeam = canManageTeam(profile.role);

  const [activities, profiles] = await Promise.all([
    listActivities({
      userId: canSeeTeam ? searchParams.userId : profile.id,
      activityType: searchParams.activityType,
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      outcome: searchParams.outcome,
    }),
    listProfiles(),
  ]);

  return (
    <PageTransition>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-[#0F1419]">Activity Feed</h1>
        <p className="text-sm text-[#6B7280]">Every manual touch, logged and timestamped.</p>
      </div>

      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <ActivitiesFilterBar users={canSeeTeam ? profiles : [profile]} />
      </Suspense>

      <Card>
        <CardContent className="pt-5">
          <ActivityTimeline activities={activities} />
        </CardContent>
      </Card>
    </PageTransition>
  );
}
