import { PipelineByStatusChart } from "@/components/dashboard/charts";

export function PipelineWidget({ data }: { data: { status: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6B7280]">No account data yet.</p>;
  }
  return <PipelineByStatusChart data={data} />;
}
