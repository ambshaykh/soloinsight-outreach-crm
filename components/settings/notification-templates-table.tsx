"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Mail, MessageSquare } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { upsertNotificationTemplate, setNotificationTemplateActive } from "@/app/actions/notifications";

type Template = {
  event_key: string;
  channel: "email" | "in_app";
  label: string;
  subject: string | null;
  body: string;
  active: boolean;
  updated_at: string;
  updated_by_profile?: { full_name: string } | null;
};

export function NotificationTemplatesTable({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  function handleToggle(t: Template, active: boolean) {
    startTransition(async () => {
      const r = await setNotificationTemplateActive(t.event_key, t.channel, active);
      if (r.error) toast.error(r.error); else { toast.success(active ? "Template enabled" : "Template disabled"); router.refresh(); }
    });
  }

  function handleSave(formData: FormData) {
    if (!editing) return;
    setSaving(true);
    startTransition(async () => {
      const r = await upsertNotificationTemplate({
        eventKey: editing.event_key,
        channel: editing.channel,
        label: String(formData.get("label") ?? editing.label),
        subject: String(formData.get("subject") ?? ""),
        body: String(formData.get("body") ?? ""),
        active: editing.active,
      });
      setSaving(false);
      if (r.error) { toast.error(r.error); return; }
      toast.success("Template saved");
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Subject / title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last edit</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t) => (
            <TableRow key={`${t.event_key}:${t.channel}`}>
              <TableCell>
                <p className="text-sm font-medium text-[#0F1419]">{t.label}</p>
                <p className="text-[11px] text-[#8B95A5]">{t.event_key}</p>
              </TableCell>
              <TableCell>
                <Badge variant={t.channel === "email" ? "default" : "success"}>
                  {t.channel === "email" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  {t.channel === "email" ? "Email" : "In-app"}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate text-sm text-[#6B7280]">{t.subject}</TableCell>
              <TableCell>
                <Switch checked={t.active} onCheckedChange={(v) => handleToggle(t, v)} />
              </TableCell>
              <TableCell className="text-xs text-[#8B95A5]">{t.updated_by_profile?.full_name ?? "—"}</TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
            <DialogDescription>Update the copy. Changes apply on the next matching event and are logged.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form action={handleSave} className="space-y-3">
              <div>
                <Label htmlFor="label">Display name</Label>
                <Input id="label" name="label" defaultValue={editing.label} />
              </div>
              <div>
                <Label htmlFor="subject">Subject / title</Label>
                <Input id="subject" name="subject" defaultValue={editing.subject ?? ""} />
              </div>
              <div>
                <Label htmlFor="body">Body</Label>
                <Textarea id="body" name="body" defaultValue={editing.body} rows={4} />
              </div>
              <p className="text-[11px] text-[#8B95A5]">
                Variables available for {editing.event_key}: wrap any of the values shown on the row (account, contact,
                actor, status, org, error, task) in double curly braces, e.g. <code>{"{{actor}}"}</code>.
              </p>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
