import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl lg:col-span-2" />
      <Skeleton className="h-56 rounded-xl lg:col-span-2" />
    </div>
  );
}
