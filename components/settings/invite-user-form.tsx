"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Copy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createInvitation } from "@/app/actions/invitations";
import { ROLE_LABELS } from "@/lib/constants";

export function InviteUserForm() {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState("sdr");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    formData.set("role", role);
    startTransition(async () => {
      const result = await createInvitation(formData);
      if (result.error) { toast.error(result.error); return; }
      setInviteUrl(result.inviteUrl ?? null);
      toast.success("Invitation created");
    });
  }

  return (
    <div className="space-y-3">
      <form action={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="teammate@company.com" />
        </div>
        <div className="w-36">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Send Invite
        </Button>
      </form>
      {inviteUrl && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <span className="truncate">{inviteUrl}</span>
          <button
            className="ml-3 flex items-center gap-1 font-medium"
            onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Copied"); }}
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
      )}
    </div>
  );
}
