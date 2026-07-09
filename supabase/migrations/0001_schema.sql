-- ============================================================================
-- Soloinsight Outreach CRM — Core Schema
-- ============================================================================
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'manager', 'sdr');

create type public.account_status as enum (
  'new', 'assigned', 'in_progress', 'engaged', 'meeting_booked',
  'not_interested', 'closed', 'stale'
);

create type public.contact_status as enum (
  'new', 'assigned', 'first_touch_sent', 'called', 'follow_up_needed',
  'positive_reply', 'meeting_booked', 'not_interested', 'wrong_person', 'closed'
);

create type public.activity_type as enum (
  'email', 'call', 'linkedin', 'note', 'meeting',
  'status_change', 'owner_assignment', 'follow_up'
);

create type public.activity_channel as enum ('email', 'phone', 'linkedin', 'in_person', 'other');

create type public.task_status as enum ('open', 'completed', 'snoozed', 'overdue');

create type public.priority_level as enum ('low', 'medium', 'high', 'urgent');

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');

create type public.call_outcome as enum (
  'connected', 'no_answer', 'voicemail', 'callback_requested',
  'wrong_number', 'not_interested', 'meeting_booked'
);

-- ----------------------------------------------------------------------------
-- TEAMS
-- ----------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PROFILES  (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  role public.user_role not null default 'sdr',
  team_id uuid references public.teams(id) on delete set null,
  two_factor_enabled boolean not null default false,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teams
  add constraint teams_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;

-- ----------------------------------------------------------------------------
-- ACCOUNTS
-- ----------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  domain text,
  industry text,
  region text,
  company_size text,
  source text,
  status public.account_status not null default 'new',
  priority public.priority_level not null default 'medium',
  icp_score integer not null default 0 check (icp_score >= 0 and icp_score <= 100),
  notes text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  last_touched_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_owner_idx on public.accounts(owner_id);
create index accounts_status_idx on public.accounts(status);
create index accounts_next_follow_up_idx on public.accounts(next_follow_up_at);

-- ----------------------------------------------------------------------------
-- CONTACTS
-- ----------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  title text,
  email text,
  phone text,
  linkedin_url text,
  status public.contact_status not null default 'new',
  lifecycle_stage text not null default 'lead',
  priority public.priority_level not null default 'medium',
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  email_touch_count integer not null default 0,
  call_touch_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_account_idx on public.contacts(account_id);
create index contacts_owner_idx on public.contacts(owner_id);
create index contacts_status_idx on public.contacts(status);
create index contacts_next_follow_up_idx on public.contacts(next_follow_up_at);

-- ----------------------------------------------------------------------------
-- ACTIVITIES  (the append-only outreach log)
-- ----------------------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  activity_type public.activity_type not null,
  channel public.activity_channel,
  subject text,
  notes text,
  outcome text,
  call_outcome public.call_outcome,
  next_follow_up_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index activities_contact_idx on public.activities(contact_id);
create index activities_account_idx on public.activities(account_id);
create index activities_created_by_idx on public.activities(created_by);
create index activities_created_at_idx on public.activities(created_at desc);
create index activities_type_idx on public.activities(activity_type);

-- ----------------------------------------------------------------------------
-- TASKS  (follow ups)
-- ----------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz not null default now(),
  status public.task_status not null default 'open',
  priority public.priority_level not null default 'medium',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assigned_idx on public.tasks(assigned_to);
create index tasks_due_idx on public.tasks(due_date);
create index tasks_status_idx on public.tasks(status);

-- ----------------------------------------------------------------------------
-- INVITATIONS
-- ----------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.user_role not null default 'sdr',
  team_id uuid references public.teams(id) on delete set null,
  invited_by uuid references public.profiles(id) on delete set null,
  status public.invitation_status not null default 'pending',
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create unique index invitations_pending_email_idx on public.invitations(email) where status = 'pending';

-- ----------------------------------------------------------------------------
-- AUDIT LOGS
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_user_idx on public.audit_logs(user_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_teams_updated before update on public.teams for each row execute function public.set_updated_at();
create trigger trg_accounts_updated before update on public.accounts for each row execute function public.set_updated_at();
create trigger trg_contacts_updated before update on public.contacts for each row execute function public.set_updated_at();
create trigger trg_tasks_updated before update on public.tasks for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- New auth user -> profile row (reads a matching pending invitation if any)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv record;
begin
  select * into inv from public.invitations
    where email = new.email and status = 'pending' and expires_at > now()
    order by created_at desc limit 1;

  insert into public.profiles (user_id, full_name, email, role, team_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(inv.role, 'sdr'),
    inv.team_id
  );

  if inv.id is not null then
    update public.invitations set status = 'accepted' where id = inv.id;
  end if;

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- Activity insert side-effects: bump last_contacted_at / touch counts / follow-up
-- ----------------------------------------------------------------------------
create or replace function public.handle_activity_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.contact_id is not null then
    update public.contacts set
      last_contacted_at = case when new.activity_type in ('email','call','linkedin','meeting')
                                then new.created_at else last_contacted_at end,
      next_follow_up_at = coalesce(new.next_follow_up_at, next_follow_up_at),
      email_touch_count = email_touch_count + case when new.activity_type = 'email' then 1 else 0 end,
      call_touch_count  = call_touch_count  + case when new.activity_type = 'call'  then 1 else 0 end
    where id = new.contact_id;
  end if;

  if new.account_id is not null then
    update public.accounts set
      last_touched_at = case when new.activity_type in ('email','call','linkedin','meeting')
                              then new.created_at else last_touched_at end,
      next_follow_up_at = coalesce(new.next_follow_up_at, next_follow_up_at)
    where id = new.account_id;
  end if;

  return new;
end;
$$;

create trigger trg_activities_insert
  after insert on public.activities
  for each row execute function public.handle_activity_insert();

-- ----------------------------------------------------------------------------
-- Generic audit log RPC (called from server actions; never inserted directly)
-- ----------------------------------------------------------------------------
create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_profile_id uuid;
begin
  select id into v_profile_id from public.profiles where user_id = auth.uid();
  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (v_profile_id, p_action, p_entity_type, p_entity_id, p_metadata);
end;
$$;

grant execute on function public.log_audit_event(text, text, uuid, jsonb) to authenticated;
