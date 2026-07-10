import { SkeletonHero, SkeletonMetricRow, SkeletonChartsRow } from "@/components/shared/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div>
      <SkeletonHero />
      <SkeletonMetricRow count={8} />
      <SkeletonChartsRow count={2} />
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
