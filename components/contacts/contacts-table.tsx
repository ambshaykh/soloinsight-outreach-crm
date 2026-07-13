"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, Trash2, Loader2, Users } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { LogActivityModal } from "@/components/activities/log-activity-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatRelativeDate, initials, fullName } from "@/lib/utils";
import { CONTACT_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { updateContactStatus, updateContactPriority, deleteContact } from "@/app/actions/contacts";
import type { Contact, ContactStatus, PriorityLevel, Profile } from "@/lib/types/database";

type Row = Contact & {
  account: { id: string; company_name: string; industry: string | null } | null;
  owner: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
};

export function ContactsTable({ contacts }: { contacts: Row[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [logging, setLogging] = useState<{ id: string; name: string; accountId: string | null; type: "email" | "call" } | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (contacts.length === 0) {
    return <EmptyState icon={Users} title="No contacts yet" description="Add a contact to start manual outreach." />;
  }

  function handleStatus(contactId: string, status: string) {
    startTransition(async () => {
      const r = await updateContactStatus(contactId, status as ContactStatus);
      if (r.error) toast.error(r.error); else { toast.success("Status updated"); router.refresh(); }
    });
  }

  function handlePriority(contactId: string, priority: string) {
    startTransition(async () => {
      const r = await updateContactPriority(contactId, priority as PriorityLevel);
      if (r.error) toast.error(r.error); else { toast.success("Priority updated"); router.refresh(); }
    });
  }

  function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    startTransition(async () => {
      const r = await deleteContact(toDelete.id);
      setDeleting(false);
      if (r.error) { toast.error(r.error); return; }
      setToDelete(null);
      toast.success("Contact deleted");
      router.refresh();
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Last Contacted</TableHead>
            <TableHead>Next Follow-up</TableHead>
            <TableHead>Quick Log</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{initials(fullName(c.first_name, c.last_name))}</AvatarFallback></Avatar>
                  <Link href={`/contacts/${c.id}`} className="font-medium text-[#0F1419] hover:text-primary hover:underline">
                    {c.first_name} {c.last_name}
                  </Link>
                </div>
              </TableCell>
              <TableCell className="text-sm text-[#6B7280]">
                {c.account ? <Link href={`/accounts/${c.account.id}`} className="hover:underline">{c.account.company_name}</Link> : "—"}
              </TableCell>
              <TableCell className="text-sm text-[#6B7280]">{c.title ?? "—"}</TableCell>
              <TableCell>
                <Select defaultValue={c.status} onValueChange={(v) => handleStatus(c.id, v)}>
                  <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select defaultValue={c.priority} onValueChange={(v) => handlePriority(c.id, v)}>
                  <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm">{c.owner?.full_name ?? "—"}</TableCell>
              <TableCell className="text-sm text-[#6B7280]">{formatRelativeDate(c.last_contacted_at)}</TableCell>
              <TableCell className="text-sm text-[#6B7280]">{formatRelativeDate(c.next_follow_up_at)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setLogging({ id: c.id, name: fullName(c.first_name, c.last_name), accountId: c.account_id, type: "email" })}>
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setLogging({ id: c.id, name: fullName(c.first_name, c.last_name), accountId: c.account_id, type: "call" })}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => setToDelete({ id: c.id, name: fullName(c.first_name, c.last_name) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <LogActivityModal
        open={!!logging}
        onOpenChange={(o) => !o && setLogging(null)}
        contactId={logging?.id}
        contactName={logging?.name}
        accountId={logging?.accountId}
        defaultType={logging?.type ?? "email"}
      />

      <Dialog open={!!toDelete} onOpenChange={(o) => !deleting && !o && setToDelete(null)}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }}>
            <DialogHeader>
              <DialogTitle>Delete {toDelete?.name}?</DialogTitle>
              <DialogDescription>This permanently removes the contact and its activity history. This can't be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={deleting} autoFocus>
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
