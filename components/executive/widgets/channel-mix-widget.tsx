import { ActivityByChannelChart } from "@/components/analytics/charts";

type ChannelPoint = { name: string; value: number };

/**
 * Phase 8 — where is outreach effort actually going? Reuses the same real
 * 60-day channel breakdown Analytics already computes (lib/data/analytics.ts
 * activityByChannel) — no new query, just surfaced at the leadership level
 * too, since "team spends most touches on X" is exactly the kind of thing
 * leadership wants without digging into the Sales portal's own Analytics tab.
 */
export function ChannelMixWidget({ data }: { data: ChannelPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <p className="py-8 text-center text-sm text-[#6B7280]">No outreach activity logged yet.</p>;
  }
  const top = [...data].sort((a, b) => b.value - a.value)[0];

  return (
    <div>
      <p className="mb-1 text-xs text-[#6B7280]">
        <span className="font-semibold text-[#0F1419]">{total}</span> touches (60 days) ·{" "}
        mostly <span className="font-semibold text-violet-700">{top.name}</span>
      </p>
      <ActivityByChannelChart data={data} />
    </div>
  );
}
