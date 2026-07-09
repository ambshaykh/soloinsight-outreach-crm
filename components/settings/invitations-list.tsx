"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { revokeInvitation } from "@/app/actions/invitations";
import { formatRelativeDate } from "@/lib/utils";

export function InvitationsList({ invitations }: { invitations: any[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const pending = invitations.filter((i) => i.status === "pending");
  if (pending.length === 0) return <p className="text-xs text-[#6B7280]">No pending invitations.</p>;

  function handleRevoke(id: string) {
    startTransition(async () => {
      const r = await revokeInvitation(id);
      if (r.error) toast.error(r.error); else { toast.success("Invitation revoked"); router.refresh(); }
    });
  }

  return (
    <ul className="space-y-2">
      {pending.map((inv) => (
        <li key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-[#0F1419]">{inv.email}</p>
            <p className="text-xs text-[#6B7280]">Invited as {ROLE_LABELS[inv.role as keyof typeof ROLE_LABELS]} · expires {formatRelativeDate(inv.expires_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Pending</Badge>
            <Button size="icon" variant="ghost" onClick={() => handleRevoke(inv.id)}><X className="h-4 w-4" /></Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
