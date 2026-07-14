// Hand-written types mirroring supabase/migrations/0001_schema.sql.
// If you regenerate with `supabase gen types typescript`, this file's shape
// (and every import site) should stay compatible.

export type UserRole = "admin" | "manager" | "sdr" | "executive" | "salesforce_admin" | "salesforce_viewer";

export type AccountStatus =
  | "new" | "assigned" | "in_progress" | "engaged" | "meeting_booked"
  | "not_interested" | "closed" | "stale";

export type ContactStatus =
  | "new" | "assigned" | "first_touch_sent" | "called" | "follow_up_needed"
  | "positive_reply" | "meeting_booked" | "not_interested" | "wrong_person" | "closed";

export type ActivityType =
  | "email" | "call" | "linkedin" | "note" | "meeting"
  | "status_change" | "owner_assignment" | "follow_up";

export type ActivityChannel = "email" | "phone" | "linkedin" | "in_person" | "other";

export type TaskStatus = "open" | "completed" | "snoozed" | "overdue";

export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type CallOutcome =
  | "connected" | "no_answer" | "voicemail" | "callback_requested"
  | "wrong_number" | "not_interested" | "meeting_booked";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  team_id: string | null;
  two_factor_enabled: boolean;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  company_name: string;
  domain: string | null;
  industry: string | null;
  region: string | null;
  company_size: string | null;
  source: string | null;
  status: AccountStatus;
  priority: PriorityLevel;
  icp_score: number;
  notes: string | null;
  owner_id: string | null;
  created_by: string | null;
  last_touched_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  account_id: string | null;
  first_name: string;
  last_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  status: ContactStatus;
  lifecycle_stage: string;
  priority: PriorityLevel;
  owner_id: string | null;
  created_by: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  email_touch_count: number;
  call_touch_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  account_id: string | null;
  contact_id: string | null;
  activity_type: ActivityType;
  channel: ActivityChannel | null;
  subject: string | null;
  notes: string | null;
  outcome: string | null;
  call_outcome: CallOutcome | null;
  next_follow_up_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  account_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  team_id: string | null;
  invited_by: string | null;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ContactWithRelations extends Contact {
  account?: Account | null;
  owner?: Profile | null;
}

export interface AccountWithRelations extends Account {
  owner?: Profile | null;
  contacts?: Contact[];
}

export interface ActivityWithRelations extends Activity {
  contact?: Contact | null;
  account?: Account | null;
  created_by_profile?: Profile | null;
}
