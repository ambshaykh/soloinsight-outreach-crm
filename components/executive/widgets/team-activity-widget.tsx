import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type PerUser = { id: string; name: string; role: string; emails: number; calls: number; linkedin: number; meetings: number; total: number };

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
        {data.slice(0, 8).map((u) => (
          <TableRow key={u.id}>
            <TableCell className="text-sm font-medium">{u.name}</TableCell>
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
