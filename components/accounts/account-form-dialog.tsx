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
import { createAccount } from "@/app/actions/accounts";
import { INDUSTRIES, SOURCES } from "@/lib/constants";

export function AccountFormDialog({
  trigger, open: openProp, onOpenChange,
}: { trigger?: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = useTransition();
  const [ownerId, setOwnerId] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");

  function handleSubmit(formData: FormData) {
    formData.set("owner_id", ownerId);
    formData.set("industry", industry);
    formData.set("source", source);
    formData.set("priority", priority);
    startTransition(async () => {
      const result = await createAccount(formData);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Account created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="h-4 w-4" /> Add Account</Button>}
      </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add account</DialogTitle>
          <DialogDescription>Create a new company you're prospecting.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="company_name">Company name</Label>
            <Input id="company_name" name="company_name" required placeholder="Acme Corp" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Input id="domain" name="domain" placeholder="acme.com" />
            </div>
            <div>
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" name="region" placeholder="Northeast" />
            </div>
            <div>
              <Label htmlFor="company_size">Company size</Label>
              <Input id="company_size" name="company_size" placeholder="201-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="icp_score">ICP fit score (0-100)</Label>
              <Input id="icp_score" name="icp_score" type="number" min={0} max={100} defaultValue={50} />
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
            <Textarea id="notes" name="notes" placeholder="Context, ICP fit rationale…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
