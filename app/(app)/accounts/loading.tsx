import { SkeletonFilters, SkeletonTable } from "@/components/shared/loading-skeleton";

export default function AccountsLoading() {
  return (
    <div>
      <SkeletonFilters />
      <SkeletonTable rows={10} />
    </div>
  );
}
