"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const COLORS = { email: "#7C3AED", call: "#C026D3", linkedin: "#A78BFA", other: "#DDD6FE" };
const PIE_COLORS = ["#7C3AED", "#C026D3", "#A78BFA", "#DDD6FE"];

export function DailyActivityChart({ data }: { data: { date: string; email: number; call: number; linkedin: number; other: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fillEmail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.email} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS.email} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillCall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.call} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS.call} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Area type="monotone" dataKey="email" name="Email" stroke={COLORS.email} fill="url(#fillEmail)" strokeWidth={2} />
        <Area type="monotone" dataKey="call" name="Call" stroke={COLORS.call} fill="url(#fillCall)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function EmailVsCallChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PipelineByStatusChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
        <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#8B95A5" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OwnerPerformanceChart({ data }: { data: { name: string; emails: number; calls: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F7" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#8B95A5" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#0F1419" }} axisLine={false} tickLine={false} width={110} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="emails" name="Emails" fill="#7C3AED" radius={[0, 4, 4, 0]} />
        <Bar dataKey="calls" name="Calls" fill="#C026D3" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
