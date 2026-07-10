import { SkeletonFilters, SkeletonTable } from "@/components/shared/loading-skeleton";

export default function ContactsLoading() {
  return (
    <div>
      <SkeletonFilters />
      <SkeletonTable rows={10} />
    </div>
  );
}
