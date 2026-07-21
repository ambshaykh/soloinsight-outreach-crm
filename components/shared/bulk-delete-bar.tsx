"use client";

import { useState } from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

/**
 * Reusable "N selected → Delete selected" bar + confirm dialog, shared by
 * the Accounts and Contacts tables' bulk-select checkboxes. Renders nothing
 * when nothing is selected.
 */
export function BulkDeleteBar({
  count,
  itemLabel,
  onDelete,
  onClear,
}: {
  count: number;
  itemLabel: string;
  onDelete: () => Promise<void>;
  onClear: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (count === 0) return null;

  const plural = count === 1 ? itemLabel : `${itemLabel}s`;

  async function handleConfirm() {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5">
        <span className="text-sm font-medium text-violet-800">{count} {plural} selected</span>
        <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete selected
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => !deleting && setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {count} {plural}?</DialogTitle>
            <DialogDescription>
              This permanently removes {count === 1 ? "this" : "these"} {plural} and any linked activity history.
              This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleting} autoFocus>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
