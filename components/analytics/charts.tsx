"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const PIE_COLORS = ["#7C3AED", "#A78BFA", "#C026D3", "#DDD6FE", "#F0ABFC"];

export function ActivityByDayChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8B95A5" }} axisLine={false} tickLine={false} interval={4} />
        <YAxis tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Line type="monotone" dataKey="count" name="Activities" stroke="#7C3AED" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ActivityByChannelChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PipelineMovementChart({ data }: { data: { week: string; new: number; engaged: number; closed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="new" name="New" stackId="a" fill="#DDD6FE" radius={[4, 4, 0, 0]} />
        <Bar dataKey="engaged" name="Engaged" stackId="a" fill="#7C3AED" radius={[4, 4, 0, 0]} />
        <Bar dataKey="closed" name="Closed" stackId="a" fill="#0F1419" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
