"use client";

import { motion } from "framer-motion";
import {
  Users, Building2, Mail, Phone, CalendarClock, CheckCircle2, Flame, Snowflake,
  TrendingUp, CalendarCheck, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  users: Users,
  building2: Building2,
  mail: Mail,
  phone: Phone,
  calendarClock: CalendarClock,
  checkCircle2: CheckCircle2,
  flame: Flame,
  snowflake: Snowflake,
  trendingUp: TrendingUp,
  calendarCheck: CalendarCheck,
  activity: Activity,
} as const;

export type MetricIconKey = keyof typeof ICONS;

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: MetricIconKey;
  accent?: "blue" | "emerald" | "amber" | "rose" | "violet";
  hint?: string;
  index?: number;
}

const ACCENTS: Record<string, string> = {
  blue: "from-indigo-500/15 to-indigo-500/5 text-indigo-600",
  emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
  rose: "from-rose-500/15 to-rose-500/5 text-rose-600",
  violet: "from-violet-500/15 to-violet-500/5 text-violet-600",
};

export function MetricCard({ label, value, icon, accent = "blue", hint, index = 0 }: MetricCardProps) {
  const Icon = ICONS[icon];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#6B7280]">{label}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br", ACCENTS[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#0F1419]">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-[#6B7280]">{hint}</p>}
    </motion.div>
  );
}
