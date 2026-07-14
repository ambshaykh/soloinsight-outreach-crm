-- Phase 3 foundation: Salesforce org connections + synced campaign stats.
--
-- salesforce_orgs holds OAuth credentials/tokens (encrypted at the app layer
-- before they ever reach this table). It has RLS enabled with ZERO policies
-- for anon/authenticated, so it is a hard deny for every normal client no
-- matter what permission a role has — the only way in is the service-role
-- admin client from server actions / the scheduled sync job, gated by
-- has_permission('salesforce.manage_connections') at the app layer.
--
-- salesforce_campaign_stats holds the synced, non-secret numbers the
-- Salesforce portal actually displays. It's readable via a normal RLS
-- policy keyed off has_permission('salesforce.view').

create table if not exists public.salesforce_orgs (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  org_edition text not null default 'unknown' check (org_edition in ('enterprise', 'professional', 'unknown')),
  instance_url text,
  consumer_key text,
  consumer_secret_encrypted text,
  refresh_token_encrypted text,
  access_token_encrypted text,
  access_token_expires_at timestamptz,
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  last_synced_at timestamptz,
  last_sync_error text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.salesforce_orgs enable row level security;
-- Intentionally no policies here — see note above.

create table if not exists public.salesforce_campaign_stats (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.salesforce_orgs(id) on delete cascade,
  sf_campaign_id text not null,
  campaign_name text not null,
  campaign_status text,
  start_date date,
  leads_uploaded int not null default 0,
  emails_sent int not null default 0,
  bounced_count int not null default 0,
  unsubscribed_count int not null default 0,
  responded_count int not null default 0,
  synced_at timestamptz not null default now(),
  unique (org_id, sf_campaign_id)
);

alter table public.salesforce_campaign_stats enable row level security;

create policy "sf_campaign_stats_select_with_permission"
  on public.salesforce_campaign_stats for select
  to authenticated
  using (public.has_permission('salesforce.view'));
-- No write policy for authenticated — only the service-role sync job writes here.

-- Security-definer accessor so the UI can show connection status (label, edition,
-- status, last synced) without ever being able to select the secret columns,
-- even by querying salesforce_orgs directly (which always denies, per above).
create or replace function public.list_salesforce_org_status()
returns table (
  id uuid,
  label text,
  org_edition text,
  status text,
  last_synced_at timestamptz,
  last_sync_error text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.label, o.org_edition, o.status, o.last_synced_at, o.last_sync_error, o.created_at
  from public.salesforce_orgs o
  where public.has_permission('salesforce.view')
  order by o.created_at;
$$;

grant execute on function public.list_salesforce_org_status() to authenticated;
