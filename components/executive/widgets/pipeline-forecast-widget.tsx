"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type WeekPoint = { week: string; new: number; engaged: number; closed: number };

/**
 * Simple ordinary-least-squares slope/intercept over evenly-spaced x values
 * (0..n-1). Good enough for a short-horizon trend projection over 6 real
 * weekly data points — not a claim of statistical rigor, just "where is this
 * headed if the current trend holds."
 */
function linearProjection(values: number[], stepsAhead: number): number[] {
  const n = values.length;
  if (n < 2) return Array(stepsAhead).fill(values[0] ?? 0);
  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (values[i] - meanY), 0);
  const den = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return Array.from({ length: stepsAhead }, (_, i) => {
    const x = n + i;
    return Math.max(0, Math.round(intercept + slope * x));
  });
}

export function PipelineForecastWidget({ data }: { data: WeekPoint[] }) {
  if (data.length < 3) {
    return <p className="py-8 text-center text-sm text-[#6B7280]">Not enough weekly history yet to project a trend.</p>;
  }

  const stepsAhead = 2;
  const newProjected = linearProjection(data.map((d) => d.new), stepsAhead);
  const engagedProjected = linearProjection(data.map((d) => d.engaged), stepsAhead);
  const closedProjected = linearProjection(data.map((d) => d.closed), stepsAhead);

  const chartData = data.map((d, i) => ({
    week: d.week,
    new_actual: d.new,
    engaged_actual: d.engaged,
    closed_actual: d.closed,
    ...(i === data.length - 1
      ? { new_projected: d.new, engaged_projected: d.engaged, closed_projected: d.closed }
      : {}),
  }));

  for (let i = 0; i < stepsAhead; i++) {
    chartData.push({
      week: `+${i + 1}w`,
      new_actual: undefined as any,
      engaged_actual: undefined as any,
      closed_actual: undefined as any,
      new_projected: newProjected[i],
      engaged_projected: engagedProjected[i],
      closed_projected: closedProjected[i],
    });
  }

  return (
    <div>
      <p className="mb-1 text-xs text-[#6B7280]">
        Based on the last {data.length} weeks of contact activity — dashed lines are a projection, not a guarantee.
        No deal-value field exists in this CRM, so this tracks volume (counts), not $ revenue.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#EDE9FE", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          <Line type="monotone" dataKey="new_actual" stroke="#7C3AED" strokeWidth={2} dot={false} name="New" connectNulls={false} />
          <Line type="monotone" dataKey="new_projected" stroke="#7C3AED" strokeWidth={2} strokeDasharray="4 4" dot={false} name="New (projected)" legendType="none" connectNulls={false} />

          <Line type="monotone" dataKey="engaged_actual" stroke="#C026D3" strokeWidth={2} dot={false} name="Engaged" connectNulls={false} />
          <Line type="monotone" dataKey="engaged_projected" stroke="#C026D3" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Engaged (projected)" legendType="none" connectNulls={false} />

          <Line type="monotone" dataKey="closed_actual" stroke="#8B95A5" strokeWidth={2} dot={false} name="Closed" connectNulls={false} />
          <Line type="monotone" dataKey="closed_projected" stroke="#8B95A5" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Closed (projected)" legendType="none" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-right text-[10px] text-[#8B95A5]">
        Solid = actual (last {data.length} weeks) · Dashed = {stepsAhead}-week projection
      </p>
    </div>
  );
}
