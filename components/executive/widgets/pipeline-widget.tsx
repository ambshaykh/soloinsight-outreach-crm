import { PipelineByStatusChart } from "@/components/dashboard/charts";

export function PipelineWidget({ data }: { data: { status: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6B7280]">No account data yet.</p>;
  }
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const inProgress = data
    .filter((d) => ["in_progress", "engaged", "assigned"].includes(d.status))
    .reduce((sum, d) => sum + d.count, 0);
  const pct = total > 0 ? Math.round((inProgress / total) * 100) : 0;

  return (
    <div>
      <p className="mb-1 text-xs text-[#6B7280]">
        <span className="font-semibold text-[#0F1419]">{total}</span> accounts total ·{" "}
        <span className="font-semibold text-[#0F1419]">{pct}%</span> actively in progress
      </p>
      <PipelineByStatusChart data={data} />
    </div>
  );
}
