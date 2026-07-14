"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleRolePermission } from "@/app/actions/permissions";
import { ROLE_LABELS } from "@/lib/constants";
import type { Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/types/database";

const EDITABLE_ROLES: UserRole[] = ["manager", "sdr", "executive", "salesforce_admin", "salesforce_viewer"];

export function RolePermissionsMatrix({
  permissions, initialGranted,
}: { permissions: Permission[]; initialGranted: string[] }) {
  const [granted, setGranted] = useState<Set<string>>(new Set(initialGranted));
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const categories = Array.from(new Set(permissions.map((p) => p.category)));

  function handleToggle(role: UserRole, key: string, checked: boolean) {
    const cellId = `${role}:${key}`;
    setPending(cellId);
    startTransition(async () => {
      const r = await toggleRolePermission(role, key, checked);
      setPending(null);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setGranted((prev) => {
        const next = new Set(prev);
        if (checked) next.add(cellId); else next.delete(cellId);
        return next;
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Admin always has every permission, regardless of what's checked here — that can't be turned off, so the matrix can never lock every admin out.
      </div>

      {categories.map((category) => (
        <div key={category} className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#0F1419]">{category}</th>
                {EDITABLE_ROLES.map((role) => (
                  <th key={role} className="px-3 py-2 text-center text-xs font-medium text-[#6B7280]">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.filter((p) => p.category === category).map((perm) => (
                <tr key={perm.key} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-[#0F1419]">{perm.label}</p>
                    {perm.description && <p className="text-xs text-[#6B7280]">{perm.description}</p>}
                  </td>
                  {EDITABLE_ROLES.map((role) => {
                    const cellId = `${role}:${perm.key}`;
                    const checked = granted.has(cellId);
                    const isPending = pending === cellId;
                    return (
                      <td key={role} className="px-3 py-2.5 text-center">
                        {isPending ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => handleToggle(role, perm.key, v === true)}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
