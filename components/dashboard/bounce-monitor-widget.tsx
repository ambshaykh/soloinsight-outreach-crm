import Link from "next/link";
import { MailWarning, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MiniBarTrend } from "@/components/shared/mini-bar-trend";

export function BounceMonitorWidget({
  summary,
}: {
  summary: {
    todayCount: number;
    weekCount: number;
    monthCount: number;
    hardCount30d: number;
    softCount30d: number;
    trend: { value: number }[];
  };
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <MailWarning className="h-4 w-4 text-rose-500" /> Bounce Monitor
        </CardTitle>
        <Link href="/bounces" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold text-[#0F1419]">{summary.todayCount}</p>
            <p className="text-[10px] text-[#8B95A5]">Today</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#0F1419]">{summary.weekCount}</p>
            <p className="text-[10px] text-[#8B95A5]">This week</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#0F1419]">{summary.monthCount}</p>
            <p className="text-[10px] text-[#8B95A5]">This month</p>
          </div>
        </div>
        <MiniBarTrend data={summary.trend} color="#E11D48" height={28} />
        <p className="mt-2 text-[11px] text-[#8B95A5]">
          {summary.hardCount30d} hard · {summary.softCount30d} soft (last 30 days)
        </p>
      </CardContent>
    </Card>
  );
}
