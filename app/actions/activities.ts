"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { ActivityType, ActivityChannel, CallOutcome } from "@/lib/types/database";

export interface LogActivityInput {
  contactId: string;
  accountId?: string | null;
  activityType: ActivityType;
  channel?: ActivityChannel | null;
  subject?: string;
  notes?: string;
  outcome?: string;
  callOutcome?: CallOutcome | null;
  nextFollowUpAt?: string | null;
  newStatus?: string | null;
}

export async function logActivity(input: LogActivityInput) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activities")
    .insert({
      contact_id: input.contactId,
      account_id: input.accountId ?? null,
      activity_type: input.activityType,
      channel: input.channel ?? null,
      subject: input.subject ?? null,
      notes: input.notes ?? null,
      outcome: input.outcome ?? null,
      call_outcome: input.callOutcome ?? null,
      next_follow_up_at: input.nextFollowUpAt ?? null,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (input.newStatus) {
    await supabase.from("contacts").update({ status: input.newStatus }).eq("id", input.contactId);
  }

  await supabase.rpc("log_audit_event", {
    p_action: `activity.${input.activityType}.logged`,
    p_entity_type: "contact",
    p_entity_id: input.contactId,
    p_metadata: { outcome: input.outcome ?? null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/contacts");
  revalidatePath("/accounts");
  revalidatePath("/outreach-queue");
  revalidatePath("/follow-ups");
  revalidatePath("/activities");
  return { error: null, activity: data };
}
