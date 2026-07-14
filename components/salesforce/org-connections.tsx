"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Link2, RefreshCw, Unlink, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  addSalesforceOrg, getSalesforceConnectUrl, disconnectSalesforceOrg,
  deleteSalesforceOrg, syncSalesforceOrgNow,
} from "@/app/actions/salesforce";

type OrgStatus = {
  id: string;
  label: string;
  org_edition: "enterprise" | "professional" | "unknown";
  status: "disconnected" | "connected" | "error";
  last_synced_at: string | null;
  last_sync_error: string | null;
  created_at: string;
};

const STATUS_BADGE = {
  connected: <Badge variant="success">Connected</Badge>,
  disconnected: <Badge variant="outline">Not connected</Badge>,
  error: <Badge variant="danger">Error</Badge>,
} as const;

export function OrgConnections({ orgs, canManage }: { orgs: OrgStatus[]; canManage: boolean }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [busyOrgId, setBusyOrgId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OrgStatus | null>(null);

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addSalesforceOrg(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Org added. Click Connect to authorize it.");
      setAddOpen(false);
      router.refresh();
    });
  }

  async function handleConnect(orgId: string) {
    setBusyOrgId(orgId);
    const result = await getSalesforceConnectUrl(orgId);
    if (result.error || !result.url) {
      toast.error(result.error ?? "Couldn't build the Salesforce connect link.");
      setBusyOrgId(null);
      return;
    }
    window.location.href = result.url;
  }

  function handleSyncNow(orgId: string) {
    setBusyOrgId(orgId);
    startTransition(async () => {
      const result = await syncSalesforceOrgNow(orgId);
      setBusyOrgId(null);
      if (!result.ok) {
        toast.error(result.error ?? "Sync failed.");
        return;
      }
      toast.success(`Synced ${result.campaignsSynced ?? 0} campaign${result.campaignsSynced === 1 ? "" : "s"}.`);
      router.refresh();
    });
  }

  function handleDisconnect(orgId: string) {
    startTransition(async () => {
      const result = await disconnectSalesforceOrg(orgId);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Disconnected.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const orgId = confirmDelete.id;
    startTransition(async () => {
      const result = await deleteSalesforceOrg(orgId);
      setConfirmDelete(null);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Org removed.");
      router.refresh();
    });
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add org
          </Button>
        </div>
      )}

      {orgs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-[#6B7280]">
          {canManage
            ? "No Salesforce orgs added yet. Click “Add org” to connect your first one."
            : "No Salesforce orgs have been connected yet."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Org</TableHead>
              <TableHead>Edition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last synced</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="text-sm font-medium">{org.label}</TableCell>
                <TableCell className="text-sm capitalize text-[#6B7280]">{org.org_edition}</TableCell>
                <TableCell>
                  {STATUS_BADGE[org.status]}
                  {org.status === "error" && org.last_sync_error && (
                    <p className="mt-1 max-w-xs truncate text-[11px] text-rose-600" title={org.last_sync_error}>
                      {org.last_sync_error}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-xs text-[#6B7280]">
                  {org.last_synced_at ? new Date(org.last_synced_at).toLocaleString() : "Never"}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {org.status === "disconnected" || org.status === "error" ? (
                        <Button size="sm" variant="secondary" disabled={busyOrgId === org.id} onClick={() => handleConnect(org.id)}>
                          {busyOrgId === org.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                          Connect
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" disabled={isPending && busyOrgId === org.id} onClick={() => handleSyncNow(org.id)}>
                            {isPending && busyOrgId === org.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            Sync now
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDisconnect(org.id)}>
                            <Unlink className="h-3.5 w-3.5" /> Disconnect
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(org)}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Salesforce org</DialogTitle>
            <DialogDescription>
              Create a Connected App in this org's Salesforce Setup first, then paste its Consumer Key and
              Consumer Secret here. Nothing is sent to Salesforce until you click Connect afterward.
            </DialogDescription>
          </DialogHeader>
          <form action={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="label">Label</Label>
              <Input id="label" name="label" placeholder="e.g. Enterprise" required autoFocus />
            </div>
            <div>
              <Label htmlFor="org_edition">Edition</Label>
              <select
                id="org_edition"
                name="org_edition"
                defaultValue="unknown"
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
              >
                <option value="enterprise">Enterprise</option>
                <option value="professional">Professional</option>
                <option value="unknown">Not sure</option>
              </select>
            </div>
            <div>
              <Label htmlFor="consumer_key">Consumer Key</Label>
              <Input id="consumer_key" name="consumer_key" required />
            </div>
            <div>
              <Label htmlFor="consumer_secret">Consumer Secret</Label>
              <Input id="consumer_secret" name="consumer_secret" type="password" required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Add org
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {confirmDelete?.label}?</DialogTitle>
            <DialogDescription>
              This deletes the stored connection and credentials for this org, and its synced campaign stats.
              This can't be undone — you'd need to reconnect from scratch.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }}>
            <DialogFooter>
              <Button type="submit" variant="secondary" className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" autoFocus disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Remove org
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
