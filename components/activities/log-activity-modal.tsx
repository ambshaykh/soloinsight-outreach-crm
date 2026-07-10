"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, Linkedin, StickyNote, CalendarCheck, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { logActivity, type LogActivityInput } from "@/app/actions/activities";
import { ContactPicker, type PickedContact } from "@/components/shared/contact-picker";
import type { ActivityType, ContactStatus } from "@/lib/types/database";

const TYPE_TABS: { type: ActivityType; label: string; icon: any }[] = [
  { type: "email", label: "Email", icon: Mail },
  { type: "call", label: "Call", icon: Phone },
  { type: "linkedin", label: "LinkedIn", icon: Linkedin },
  { type: "meeting", label: "Meeting", icon: CalendarCheck },
  { type: "note", label: "Note", icon: StickyNote },
];

const OUTCOME_CHIPS: Record<ActivityType, { label: string; outcome: string; status?: ContactStatus; callOutcome?: string }[]> = {
  email: [
    { label: "No response yet", outcome: "No response yet" },
    { label: "Positive reply", outcome: "Positive reply", status: "positive_reply" },
    { label: "Not interested", outcome: "Not interested", status: "not_interested" },
    { label: "Wrong person", outcome: "Wrong person", status: "wrong_person" },
  ],
  call: [
    { label: "Connected", outcome: "Connected", status: "called", callOutcome: "connected" },
    { label: "No answer", outcome: "No answer", status: "follow_up_needed", callOutcome: "no_answer" },
    { label: "Voicemail", outcome: "Left voicemail", status: "follow_up_needed", callOutcome: "voicemail" },
    { label: "Callback requested", outcome: "Callback requested", status: "follow_up_needed", callOutcome: "callback_requested" },
    { label: "Wrong number", outcome: "Wrong number", status: "wrong_person", callOutcome: "wrong_number" },
    { label: "Not interested", outcome: "Not interested", status: "not_interested", callOutcome: "not_interested" },
    { label: "Meeting booked", outcome: "Meeting booked", status: "meeting_booked", callOutcome: "meeting_booked" },
  ],
  linkedin: [
    { label: "No response yet", outcome: "No response yet" },
    { label: "Positive reply", outcome: "Positive reply", status: "positive_reply" },
    { label: "Not interested", outcome: "Not interested", status: "not_interested" },
  ],
  meeting: [{ label: "Meeting booked", outcome: "Meeting booked", status: "meeting_booked" }],
  note: [],
  status_change: [], owner_assignment: [], follow_up: [],
};

interface LogActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
  accountId?: string | null;
  contactName?: string;
  defaultType?: ActivityType;
}

export function LogActivityModal({
  open, onOpenChange, contactId, accountId, contactName, defaultType = "email",
}: LogActivityModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<ActivityType>(defaultType);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [chipIndex, setChipIndex] = useState<number | null>(null);
  const [picked, setPicked] = useState<PickedContact | null>(null);

  const activeContactId = contactId ?? picked?.id;
  const activeAccountId = accountId ?? picked?.account_id ?? null;
  const chips = OUTCOME_CHIPS[type] ?? [];

  function reset() {
    setSubject(""); setNotes(""); setFollowUp(""); setChipIndex(null); setPicked(null);
  }

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!activeContactId) {
      toast.error("Pick a contact to log this activity against.");
      return;
    }
    const chip = chipIndex !== null ? chips[chipIndex] : undefined;
    const input: LogActivityInput = {
      contactId: activeContactId,
      accountId: activeAccountId,
      activityType: type,
      channel: type === "email" ? "email" : type === "call" ? "phone" : type === "linkedin" ? "linkedin" : type === "meeting" ? "in_person" : "other",
      subject: type === "email" ? subject : undefined,
      notes,
      outcome: chip?.outcome,
      callOutcome: chip?.callOutcome as any,
      nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null,
      newStatus: chip?.status ?? null,
    };

    startTransition(async () => {
      const result = await logActivity(input);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${TYPE_TABS.find((t) => t.type === type)?.label} logged`);
      reset();
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log manual activity</DialogTitle>
          <DialogDescription>
            {contactName ? `Logging outreach for ${contactName}.` : "Pick a contact, then log what happened."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {!contactId && (
            <div className="mb-4">
              <Label>Contact</Label>
              {picked ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span>{picked.first_name} {picked.last_name}</span>
                  <button type="button" className="text-xs text-primary" onClick={() => setPicked(null)}>Change</button>
                </div>
              ) : (
                <ContactPicker onSelect={setPicked} />
              )}
            </div>
          )}

          <div className="mb-4 grid grid-cols-5 gap-1.5">
            {TYPE_TABS.map(({ type: t, label, icon: Icon }) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setChipIndex(null); }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium transition-colors",
                  type === t ? "border-primary bg-blue-50 text-primary" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {chips.map((chip, i) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setChipIndex(chipIndex === i ? null : i)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    chipIndex === i ? "border-primary bg-primary text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {type === "email" && (
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick question about…" />
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened, what was said…" />
            </div>
            <div>
              <Label htmlFor="follow_up">Next follow-up</Label>
              <Input id="follow_up" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
