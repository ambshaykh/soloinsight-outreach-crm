"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { EmptySearchState } from "@/components/shared/state-patterns";
import { ROLE_LABELS } from "@/lib/constants";
import { updateUserRole, toggleUserActive } from "@/app/actions/users";
import { initials, formatRelativeDate } from "@/lib/utils";
import type { Profile, UserRole } from "@/lib/types/database";

// Roles considered "more privileged" than others, left-to-right, for the
// role-downgrade confirm prompt (admin > manager/salesforce_admin > sdr/salesforce_viewer/executive).
const ROLE_RANK: Record<UserRole, number> = {
  admin: 3, manager: 2, salesforce_admin: 2, sdr: 1, salesforce_viewer: 1, executive: 1,
};

export function UsersTable({
  profiles, isAdmin, currentUserId, lastSignIn = {},
}: { profiles: Profile[]; isAdmin: boolean; currentUserId: string; lastSignIn?: Record<string, string | null> }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pendingRoleChange, setPendingRoleChange] = useState<{ id: string; name: string; from: UserRole; to: UserRole } | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (search && !`${p.full_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [profiles, roleFilter, statusFilter, search]);

  function commitRole(id: string, role: string) {
    startTransition(async () => {
      const r = await updateUserRole(id, role as UserRole);
      if (r.error) toast.error(r.error); else { toast.success("Role updated"); router.refresh(); }
    });
  }

  function handleRole(profile: Profile, role: string) {
    const to = role as UserRole;
    if (ROLE_RANK[to] < ROLE_RANK[profile.role]) {
      setPendingRoleChange({ id: profile.id, name: profile.full_name, from: profile.role, to });
    } else {
      commitRole(profile.id, role);
    }
  }

  function commitActive(id: string, active: boolean) {
    startTransition(async () => {
      const r = await toggleUserActive(id, active);
      if (r.error) toast.error(r.error); else { toast.success(active ? "User reactivated" : "User deactivated"); router.refresh(); }
    });
  }

  function handleActive(profile: Profile, active: boolean) {
    if (!active) setPendingDeactivate({ id: profile.id, name: profile.full_name });
    else commitActive(profile.id, true);
  }

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="All status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptySearchState onClearFilters={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
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
                    <Select value={p.role} onValueChange={(v) => handleRole(p, v)} disabled={p.id === currentUserId}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm">{ROLE_LABELS[p.role]}</span>
                  )}
                </TableCell>
                <TableCell><SecurityStatusBadge enabled={p.two_factor_enabled} /></TableCell>
                <TableCell className="text-xs text-[#6B7280]">
                  {lastSignIn[p.user_id] ? formatRelativeDate(lastSignIn[p.user_id]) : "Never"}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Switch checked={p.is_active} onCheckedChange={(v) => handleActive(p, v)} disabled={p.id === currentUserId} />
                  ) : (
                    <span className="text-sm">{p.is_active ? "Active" : "Inactive"}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={pendingDeactivate !== null} onOpenChange={(o) => !o && setPendingDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {pendingDeactivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This immediately blocks their sign-in and revokes any existing session — even one that's currently
              active elsewhere. They'll need to be reactivated by an admin to regain access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => { if (pendingDeactivate) commitActive(pendingDeactivate.id, false); setPendingDeactivate(null); }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingRoleChange !== null} onOpenChange={(o) => !o && setPendingRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change {pendingRoleChange?.name}'s role?</AlertDialogTitle>
            <AlertDialogDescription>
              This lowers their access from <strong>{pendingRoleChange && ROLE_LABELS[pendingRoleChange.from]}</strong> to{" "}
              <strong>{pendingRoleChange && ROLE_LABELS[pendingRoleChange.to]}</strong>. They'll immediately lose any
              permissions that come with the old role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (pendingRoleChange) commitRole(pendingRoleChange.id, pendingRoleChange.to); setPendingRoleChange(null); }}
            >
              Change role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
