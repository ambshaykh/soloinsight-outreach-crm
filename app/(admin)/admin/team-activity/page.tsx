import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getTeamActivityFeed } from "@/lib/data/team-activity";
import { listProfiles } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { PermissionDeniedState } from "@/components/shared/state-patterns";
import { TeamActivityDashboard } from "@/components/admin/team-activity-dashboard";

export default async function TeamActivityPage() {
  await requireProfile();
  const canView = await hasPermission("analytics.view");

  if (!canView) {
    return (
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0F1419]">Team Activity</h1>
        </div>
        <PermissionDeniedState />
      </PageTransition>
    );
  }

  const [activities, profiles] = await Promise.all([
    getTeamActivityFeed(500),
    listProfiles(),
  ]);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Team Activity</h1>
        <p className="text-sm text-[#6B7280]">
          Manual outreach logged by your team — emails, calls, LinkedIn touches, meetings, and notes. Most recent 500 shown.
        </p>
      </div>
      <TeamActivityDashboard activities={activities as any} profiles={profiles} />
    </PageTransition>
  );
}
