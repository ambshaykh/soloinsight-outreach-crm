"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACTIVITY_TYPE_LABELS } from "@/lib/constants";

export function ActivitiesFilterBar({ users }: { users: { id: string; full_name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      <div>
        <Label>User</Label>
        <Select defaultValue={searchParams.get("userId") ?? "all"} onValueChange={(v) => setParam("userId", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Type</Label>
        <Select defaultValue={searchParams.get("activityType") ?? "all"} onValueChange={(v) => setParam("activityType", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>From</Label>
        <Input type="date" defaultValue={searchParams.get("dateFrom") ?? ""} onChange={(e) => setParam("dateFrom", e.target.value)} />
      </div>
      <div>
        <Label>To</Label>
        <Input type="date" defaultValue={searchParams.get("dateTo") ?? ""} onChange={(e) => setParam("dateTo", e.target.value)} />
      </div>
      <div>
        <Label>Outcome contains</Label>
        <Input
          placeholder="e.g. positive"
          defaultValue={searchParams.get("outcome") ?? ""}
          onKeyDown={(e) => { if (e.key === "Enter") setParam("outcome", (e.target as HTMLInputElement).value); }}
        />
      </div>
    </div>
  );
}
