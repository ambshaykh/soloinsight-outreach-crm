import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PerUser = { id: string; name: string; role: string; emails: number; calls: number; linkedin: number; meetings: number; total: number };

const MEDAL_STYLES = [
  "bg-amber-100 text-amber-700", // 1st
  "bg-slate-200 text-slate-600", // 2nd
  "bg-orange-100 text-orange-700", // 3rd
];

export function TeamActivityWidget({ data }: { data: PerUser[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6B7280]">No team activity in the last 60 days.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rep</TableHead>
          <TableHead>Emails</TableHead>
          <TableHead>Calls</TableHead>
          <TableHead>Meetings</TableHead>
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
            <TableCell className="text-sm font-semibold">{u.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
