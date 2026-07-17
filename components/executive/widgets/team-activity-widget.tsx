import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type LeaderboardRow = {
  id: string; name: string; role: string;
  emails: number; calls: number; linkedin: number; meetings: number; total: number;
  replyRate: number | null;
  completionRate: number | null;
  overdueTasks: number;
};

const MEDAL_STYLES = [
  "bg-amber-100 text-amber-700", // 1st
  "bg-slate-200 text-slate-600", // 2nd
  "bg-orange-100 text-orange-700", // 3rd
];

export function TeamActivityWidget({ data }: { data: LeaderboardRow[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6B7280]">No team activity in the last 60 days.</p>;
  }
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rep</TableHead>
            <TableHead>Emails</TableHead>
            <TableHead>Calls</TableHead>
            <TableHead>Meetings</TableHead>
            <TableHead>Reply rate</TableHead>
            <TableHead>Follow-up completion</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 8).map((u, i) => (
            <TableRow key={u.id}>
              <TableCell className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  {i < 3 ? (
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", MEDAL_STYLES[i])}>
                      {i + 1}
                    </span>
                  ) : (
                    <span className="w-5 text-center text-[10px] text-[#8B95A5]">{i + 1}</span>
                  )}
                  {u.name}
                </span>
              </TableCell>
              <TableCell className="text-sm text-[#6B7280]">{u.emails}</TableCell>
              <TableCell className="text-sm text-[#6B7280]">{u.calls}</TableCell>
              <TableCell className="text-sm text-[#6B7280]">{u.meetings}</TableCell>
              <TableCell className="text-sm text-[#6B7280]">{u.replyRate !== null ? `${u.replyRate}%` : "—"}</TableCell>
              <TableCell className="text-sm">
                {u.completionRate !== null ? (
                  <span className={cn(u.overdueTasks > 0 ? "text-amber-600" : "text-emerald-600")}>
                    {u.completionRate}%{u.overdueTasks > 0 && <span className="ml-1 text-[10px] text-[#8B95A5]">({u.overdueTasks} overdue)</span>}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-sm font-semibold">{u.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Link href="/executive/leaderboard" className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline">
        View full team leaderboard <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
