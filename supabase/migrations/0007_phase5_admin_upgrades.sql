-- ============================================================================
-- Phase 5: Admin Center upgrades — notifications & templates, reports catalog
-- run history, per-user UI preferences, and two new permission keys.
--
-- Nothing here touches existing tables' behavior except adding a
-- `preferences` column to profiles (safe, defaulted). Everything else is
-- brand-new tables.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Per-user UI preferences (timezone, density, high-contrast, reduced motion)
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- ----------------------------------------------------------------------------
-- Notification templates + channel routing.
-- One row per (event_key, channel) pair, matching the "routing matrix" idea:
-- each event can fire on email and/or in_app independently.
-- ----------------------------------------------------------------------------
create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  channel text not null check (channel in ('email', 'in_app')),
  label text not null,
  subject text,
  body text not null,
  active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (event_key, channel)
);

alter table public.notification_templates enable row level security;

create policy "notification_templates_select_all_authenticated"
  on public.notification_templates for select
  to authenticated
  using (true);

create policy "notification_templates_write_gated"
  on public.notification_templates for all
  to authenticated
  using (public.has_permission('notifications.manage'))
  with check (public.has_permission('notifications.manage'));

-- ----------------------------------------------------------------------------
-- In-app notification inbox. Recipients can read + mark their own as read.
-- Inserts happen only through the notify() function below, so any signed-in
-- user can trigger a notification for a colleague (e.g. "lead assigned to
-- you") without needing row-level write access to other people's rows.
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_unread_idx on public.notifications(recipient_id, read_at);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (recipient_id = public.current_profile_id());

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (recipient_id = public.current_profile_id())
  with check (recipient_id = public.current_profile_id());

-- no insert policy for regular clients — only notify() (security definer) can write.

create or replace function public.notify(
  p_recipient_id uuid,
  p_event_key text,
  p_title text,
  p_body text default null,
  p_link text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_in_app_active boolean;
begin
  select coalesce(
    (select active from public.notification_templates where event_key = p_event_key and channel = 'in_app'),
    true -- if no template row exists yet for this event, default to "on" so nothing silently disappears
  ) into v_in_app_active;

  if v_in_app_active and p_recipient_id is not null then
    insert into public.notifications (recipient_id, event_key, title, body, link)
    values (p_recipient_id, p_event_key, p_title, p_body, p_link);
  end if;
end;
$$;

grant execute on function public.notify(uuid, text, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Report run history (Reports & Analytics catalog).
-- ----------------------------------------------------------------------------
create table if not exists public.report_runs (
  id uuid primary key default gen_random_uuid(),
  report_key text not null,
  report_label text not null,
  run_by uuid references public.profiles(id) on delete set null,
  row_count int not null default 0,
  format text not null default 'csv',
  created_at timestamptz not null default now()
);

create index if not exists report_runs_created_at_idx on public.report_runs(created_at desc);

alter table public.report_runs enable row level security;

create policy "report_runs_select_gated"
  on public.report_runs for select
  to authenticated
  using (public.has_permission('reports.view'));

create policy "report_runs_insert_gated"
  on public.report_runs for insert
  to authenticated
  with check (public.has_permission('reports.view') and run_by = public.current_profile_id());

-- ----------------------------------------------------------------------------
-- Two new permission keys, seeded sensibly for existing roles.
-- ----------------------------------------------------------------------------
insert into public.permissions (key, label, description, category, sort_order) values
  ('notifications.manage', 'Manage notification templates', 'Edit notification copy and channel routing.', 'Team & Admin', 50),
  ('reports.view', 'View reports & analytics catalog', 'Run and export the pre-built report catalog.', 'Team & Admin', 60)
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
values
  ('admin', 'notifications.manage'), ('admin', 'reports.view'),
  ('manager', 'reports.view'),
  ('executive', 'reports.view')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Seed default in-app templates for the events this phase actually wires up.
-- Email-channel rows aren't seeded — there's no email provider connected
-- yet, so an email template would look active but silently do nothing.
-- Admins can still add one from the Notifications & Templates page; it'll
-- start working the moment an email provider is wired up.
-- ----------------------------------------------------------------------------
insert into public.notification_templates (event_key, channel, label, subject, body, active) values
  ('account.assigned', 'in_app', 'Account assigned to you', '{{account}} was assigned to you', '{{actor}} assigned you this account.', true),
  ('account.status_changed', 'in_app', 'Account status changed', '{{account}} moved to a new stage', '{{actor}} changed the status to "{{status}}".', true),
  ('contact.assigned', 'in_app', 'Contact assigned to you', '{{contact}} was assigned to you', '{{actor}} assigned you this contact.', true),
  ('salesforce.sync_failed', 'in_app', 'Salesforce sync failed', 'Salesforce sync failed for {{org}}', '{{error}}', true),
  ('task.overdue', 'in_app', 'Follow-up overdue', 'Overdue: {{task}}', 'This follow-up for {{contact}} is past its due date.', true)
on conflict (event_key, channel) do nothing;
