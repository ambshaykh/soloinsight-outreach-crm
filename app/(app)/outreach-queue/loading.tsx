import { SkeletonKanban } from "@/components/shared/loading-skeleton";

export default function OutreachQueueLoading() {
  return <SkeletonKanban columns={7} />;
}
