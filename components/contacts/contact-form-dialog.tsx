"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { OwnerSelect } from "@/components/shared/owner-select";
import { AccountPicker, type PickedAccount } from "@/components/shared/account-picker";
import { createContact } from "@/app/actions/contacts";

export function ContactFormDialog({
  trigger, defaultAccountId, defaultAccountLabel, open: openProp, onOpenChange,
}: {
  trigger?: React.ReactNode; defaultAccountId?: string; defaultAccountLabel?: string;
  open?: boolean; onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = useTransition();
  const [ownerId, setOwnerId] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [account, setAccount] = useState<PickedAccount | null>(
    defaultAccountId ? { id: defaultAccountId, company_name: defaultAccountLabel ?? "" } : null
  );

  function handleSubmit(formData: FormData) {
    formData.set("owner_id", ownerId);
    formData.set("priority", priority);
    formData.set("account_id", account?.id ?? "");
    startTransition(async () => {
      const result = await createContact(formData);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Contact created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
      <DialogTrigger asChild>
        {trigger ?? <Button variant="secondary"><Plus className="h-4 w-4" /> Add Contact</Button>}
      </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
          <DialogDescription>Add a person to prospect at an account.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <Label>Account</Label>
            {account ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span>{account.company_name}</span>
                {!defaultAccountId && (
                  <button type="button" className="text-xs text-primary" onClick={() => setAccount(null)}>Change</button>
                )}
              </div>
            ) : (
              <AccountPicker onSelect={setAccount} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" name="first_name" required />
            </div>
            <div>
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" name="last_name" required />
            </div>
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Director of IT" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>
          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input id="linkedin_url" name="linkedin_url" placeholder="https://linkedin.com/in/…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="next_follow_up_at">Next follow-up</Label>
              <Input id="next_follow_up_at" name="next_follow_up_at" type="date" />
            </div>
          </div>
          <div>
            <Label>Owner</Label>
            <OwnerSelect value={ownerId} onChange={setOwnerId} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
