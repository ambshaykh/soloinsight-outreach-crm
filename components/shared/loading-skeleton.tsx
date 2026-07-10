import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonHero() {
  return <Skeleton className="mb-6 h-32 w-full rounded-2xl" />;
}

export function SkeletonMetricRow({ count = 8 }: { count?: number }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

export function SkeletonChartsRow({ count = 2 }: { count?: number }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  );
}

export function SkeletonFilters() {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-10 w-36 rounded-lg" />
      <Skeleton className="h-10 w-36 rounded-lg" />
    </div>
  );
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonKanban({ columns = 7 }: { columns?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border bg-slate-50/60 p-2">
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3, height = "h-56" }: { count?: number; height?: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} rounded-xl`} />
      ))}
    </div>
  );
}
