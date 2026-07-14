import type { AccountStatus, ContactStatus, PriorityLevel, ActivityType, TaskStatus, UserRole } from "@/lib/types/database";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  sdr: "SDR",
  executive: "Executive",
  salesforce_admin: "Salesforce Admin",
  salesforce_viewer: "Salesforce Viewer",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  engaged: "Engaged",
  meeting_booked: "Meeting Booked",
  not_interested: "Not Interested",
  closed: "Closed",
  stale: "Stale",
};

export const ACCOUNT_STATUS_COLORS: Record<AccountStatus, string> = {
  new: "bg-slate-100 text-slate-700 border-slate-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  engaged: "bg-cyan-50 text-cyan-700 border-cyan-200",
  meeting_booked: "bg-emerald-50 text-emerald-700 border-emerald-200",
  not_interested: "bg-rose-50 text-rose-700 border-rose-200",
  closed: "bg-slate-200 text-slate-600 border-slate-300",
  stale: "bg-orange-50 text-orange-700 border-orange-200",
};

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: "New",
  assigned: "Assigned",
  first_touch_sent: "First Touch Sent",
  called: "Called",
  follow_up_needed: "Follow Up Needed",
  positive_reply: "Positive Reply",
  meeting_booked: "Meeting Booked",
  not_interested: "Not Interested",
  wrong_person: "Wrong Person",
  closed: "Closed",
};

export const CONTACT_STATUS_COLORS: Record<ContactStatus, string> = {
  new: "bg-slate-100 text-slate-700 border-slate-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  first_touch_sent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  called: "bg-violet-50 text-violet-700 border-violet-200",
  follow_up_needed: "bg-amber-50 text-amber-700 border-amber-200",
  positive_reply: "bg-emerald-50 text-emerald-700 border-emerald-200",
  meeting_booked: "bg-green-100 text-green-800 border-green-300",
  not_interested: "bg-rose-50 text-rose-700 border-rose-200",
  wrong_person: "bg-red-50 text-red-700 border-red-200",
  closed: "bg-slate-200 text-slate-600 border-slate-300",
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-rose-100 text-rose-700 border-rose-300",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open", completed: "Completed", snoozed: "Snoozed", overdue: "Overdue",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  email: "Email",
  call: "Call",
  linkedin: "LinkedIn",
  note: "Note",
  meeting: "Meeting",
  status_change: "Status Change",
  owner_assignment: "Owner Assignment",
  follow_up: "Follow Up",
};

export const KANBAN_COLUMNS: { status: ContactStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "assigned", label: "Assigned" },
  { status: "first_touch_sent", label: "First Touch" },
  { status: "called", label: "Called" },
  { status: "follow_up_needed", label: "Follow Up Needed" },
  { status: "positive_reply", label: "Positive Reply" },
  { status: "meeting_booked", label: "Meeting Booked" },
  { status: "not_interested", label: "Not Interested" },
  { status: "closed", label: "Closed" },
];

export const INDUSTRIES = [
  "Healthcare", "Enterprise Security", "Banking", "Manufacturing",
  "Education", "Corporate Real Estate", "Government", "Technology",
];

export const SOURCES = [
  "ZoomInfo", "Apollo", "LeadIQ", "Manual Research", "Referral", "Website", "Event List",
];
