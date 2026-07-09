"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { ROLE_LABELS } from "@/lib/constants";
import { updateUserRole, toggleUserActive } from "@/app/actions/users";
import { initials } from "@/lib/utils";
import type { Profile, UserRole } from "@/lib/types/database";

export function UsersTable({ profiles, isAdmin, currentUserId }: { profiles: Profile[]; isAdmin: boolean; currentUserId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleRole(id: string, role: string) {
    startTransition(async () => {
      const r = await updateUserRole(id, role as UserRole);
      if (r.error) toast.error(r.error); else { toast.success("Role updated"); router.refresh(); }
    });
  }

  function handleActive(id: string, active: boolean) {
    startTransition(async () => {
      const r = await toggleUserActive(id, active);
      if (r.error) toast.error(r.error); else { toast.success(active ? "User reactivated" : "User deactivated"); router.refresh(); }
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>2FA</TableHead>
          <TableHead>Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{initials(p.full_name)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium text-[#0F1419]">{p.full_name} {p.id === currentUserId && <span className="text-[10px] text-[#6B7280]">(you)</span>}</p>
                  <p className="text-xs text-[#6B7280]">{p.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {isAdmin ? (
                <Select defaultValue={p.role} onValueChange={(v) => handleRole(p.id, v)} disabled={p.id === currentUserId}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">{ROLE_LABELS[p.role]}</span>
              )}
            </TableCell>
            <TableCell><SecurityStatusBadge enabled={p.two_factor_enabled} /></TableCell>
            <TableCell>
              {isAdmin ? (
                <Switch checked={p.is_active} onCheckedChange={(v) => handleActive(p.id, v)} disabled={p.id === currentUserId} />
              ) : (
                <span className="text-sm">{p.is_active ? "Active" : "Inactive"}</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
