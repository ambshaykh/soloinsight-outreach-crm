-- Phase 13: Bounce Monitor (Sales portal) — email bounce events, written by
-- an n8n workflow going forward. Follows the same write convention
-- established in 0009_outreach_summary.sql: no INSERT/UPDATE policy for
-- `authenticated`, since only a service-role client (n8n, or your own
-- script) should ever write here. The service role always bypasses RLS.
--
-- n8n only needs to send email, bounce_type, reason, and a timestamp — it
-- does NOT need to know CRM-internal contact/account ids. The trigger below
-- resolves contact_id/account_id automatically via a case-insensitive match
-- against contacts.email, so "which of my contacts bounced" works even if
-- n8n only ever sees a raw email address. If n8n *does* already know the
-- contact_id (e.g. it triggered off a CRM-side send), passing it directly
-- is also supported — the trigger only fills in gaps, never overwrites a
-- value that was explicitly supplied.

create table if not exists public.email_bounces (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  bounce_type text not null check (bounce_type in ('hard', 'soft')),
  reason text,
  campaign_label text,
  bounced_at timestamptz not null default now(),
  contact_id uuid references public.contacts(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  raw_payload jsonb,
  data_source text not null default 'n8n' check (data_source in ('n8n', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists email_bounces_bounced_at_idx on public.email_bounces(bounced_at desc);
create index if not exists email_bounces_contact_idx on public.email_bounces(contact_id);
create index if not exists email_bounces_account_idx on public.email_bounces(account_id);
create index if not exists email_bounces_email_idx on public.email_bounces(lower(email));

-- ---------------------------------------------------------------------------
-- Auto-resolve contact_id/account_id from the bounced email address.
-- Only fills in NULLs — never clobbers a value the caller already set.
-- If multiple contacts share an email address, the most recently updated
-- one wins (arbitrary but deterministic).
-- ---------------------------------------------------------------------------
create or replace function public.resolve_bounce_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact_id uuid;
  v_account_id uuid;
begin
  if new.contact_id is null and new.email is not null then
    select c.id, c.account_id into v_contact_id, v_account_id
      from public.contacts c
      where lower(c.email) = lower(new.email)
      order by c.updated_at desc
      limit 1;
    if v_contact_id is not null then
      new.contact_id := v_contact_id;
      if new.account_id is null then
        new.account_id := v_account_id;
      end if;
    end if;
  end if;

  if new.contact_id is not null and new.account_id is null then
    select c.account_id into v_account_id from public.contacts c where c.id = new.contact_id;
    new.account_id := v_account_id;
  end if;

  return new;
end;
$$;

drop trigger if exists email_bounces_resolve_contact on public.email_bounces;
create trigger email_bounces_resolve_contact
  before insert on public.email_bounces
  for each row
  execute function public.resolve_bounce_contact();

alter table public.email_bounces enable row level security;

-- Same owner-or-admin-manager scoping as accounts_select / contacts_select /
-- activities_select, so a rep's dashboard widget and full page show bounces
-- for their own book rather than the whole company's. Unmatched bounces
-- (no contact resolved) are visible to everyone so they don't silently
-- disappear from view for non-admins.
create policy "email_bounces_select"
  on public.email_bounces for select
  to authenticated
  using (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or contact_id is null
      or exists (
        select 1 from public.contacts c where c.id = email_bounces.contact_id
          and (c.owner_id = public.current_profile_id() or c.created_by = public.current_profile_id())
      )
      or exists (
        select 1 from public.accounts a where a.id = email_bounces.account_id
          and (a.owner_id = public.current_profile_id() or a.created_by = public.current_profile_id())
      )
    )
  );
-- No write policy for `authenticated` — only a service-role client (n8n, or
-- your own script) inserts here going forward.
