import { SkeletonHero, SkeletonMetricRow, SkeletonChartsRow, SkeletonCards } from "@/components/shared/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <SkeletonHero />
      <SkeletonMetricRow count={8} />
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <SkeletonChartsRow count={2} />
      <SkeletonCards count={3} height="h-56" />
    </div>
  );
}
