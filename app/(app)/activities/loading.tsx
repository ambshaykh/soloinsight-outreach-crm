import { SkeletonFilters, SkeletonTable } from "@/components/shared/loading-skeleton";

export default function ActivitiesLoading() {
  return (
    <div>
      <SkeletonFilters />
      <SkeletonTable rows={12} />
    </div>
  );
}
