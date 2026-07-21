import { listBounces } from "@/lib/data/bounces";
import { PageTransition } from "@/components/shared/page-transition";
import { BounceMonitorDashboard } from "@/components/bounces/bounce-monitor-dashboard";

export default async function BouncesPage() {
  const bounces = await listBounces({ limit: 2000 });

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Bounce Monitor</h1>
        <p className="text-sm text-[#6B7280]">
          Email bounces synced from your n8n workflow — hard vs. soft, linked back to the matching contact and account where possible.
        </p>
      </div>
      <BounceMonitorDashboard bounces={bounces as any} />
    </PageTransition>
  );
}
