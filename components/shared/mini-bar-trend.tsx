"use client";

/**
 * Tiny inline SVG bar trend — no charting library needed. Used for compact
 * "last N days" sparklines inside widget headers (e.g. Team Activity).
 */
export function MiniBarTrend({
  data,
  className,
  color = "#7C3AED",
  height = 32,
}: {
  data: { value: number }[];
  className?: string;
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
      aria-hidden="true"
    >
      {data.map((d, i) => {
        const h = Math.max(1, (d.value / max) * (height - 2));
        return (
          <rect
            key={i}
            x={i * barWidth + barWidth * 0.15}
            y={height - h}
            width={barWidth * 0.7}
            height={h}
            rx={0.6}
            fill={color}
            opacity={i === data.length - 1 ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}
