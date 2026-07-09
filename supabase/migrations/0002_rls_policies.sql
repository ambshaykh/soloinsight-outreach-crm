-- ============================================================================
-- Soloinsight Outreach CRM — Row Level Security
-- Every table below has RLS enabled. Access is enforced in the database,
-- not just hidden in the UI. Helper functions are SECURITY DEFINER so they
-- can safely read public.profiles without causing recursive RLS evaluation.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.accounts enable row level security;
alter table public.contacts enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_logs enable row level security;

-- ----------------------------------------------------------------------------
-- Helper functions
-- ----------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.current_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where user_id = auth.uid()), false);
$$;

create or replace function public.is_admin_or_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','manager') from public.profiles where user_id = auth.uid()), false);
$$;

-- Mandatory 2FA gate: once a session's TOTP factor is verified, Supabase Auth
-- issues a JWT with aal = 'aal2'. Every business-data policy below requires
-- aal2, so even a stolen aal1 access token cannot read/write CRM data until
-- 2FA has been completed. Reading/updating one's own profile is allowed at
-- aal1 so the user can actually get through the 2FA enrollment screen.
create or replace function public.has_verified_mfa()
returns boolean language sql stable as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2';
$$;

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------
create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_self_or_admin"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (
    user_id = auth.uid() or public.is_admin()
  );

create policy "profiles_delete_admin_only"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- profile rows are created exclusively by the handle_new_auth_user trigger
-- (security definer) — no direct client-side inserts are permitted.

-- ----------------------------------------------------------------------------
-- TEAMS
-- ----------------------------------------------------------------------------
create policy "teams_select_all_authenticated"
  on public.teams for select to authenticated using (true);

create policy "teams_write_admin_only"
  on public.teams for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- ACCOUNTS
-- ----------------------------------------------------------------------------
create policy "accounts_select"
  on public.accounts for select
  to authenticated
  using (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or owner_id = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  );

create policy "accounts_insert"
  on public.accounts for insert
  to authenticated
  with check (
    public.has_verified_mfa() and created_by = public.current_profile_id()
  );

create policy "accounts_update"
  on public.accounts for update
  to authenticated
  using (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or owner_id = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  )
  with check (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or owner_id = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  );

create policy "accounts_delete_admin_only"
  on public.accounts for delete
  to authenticated
  using (public.has_verified_mfa() and public.is_admin());

-- ----------------------------------------------------------------------------
-- CONTACTS
-- ----------------------------------------------------------------------------
create policy "contacts_select"
  on public.contacts for select
  to authenticated
  using (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or owner_id = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  );

create policy "contacts_insert"
  on public.contacts for insert
  to authenticated
  with check (
    public.has_verified_mfa() and created_by = public.current_profile_id()
  );

create policy "contacts_update"
  on public.contacts for update
  to authenticated
  using (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or owner_id = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  )
  with check (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or owner_id = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  );

create policy "contacts_delete_admin_only"
  on public.contacts for delete
  to authenticated
  using (public.has_verified_mfa() and public.is_admin());

-- ----------------------------------------------------------------------------
-- ACTIVITIES  (manual outreach log — insert-heavy, append-only in spirit)
-- ----------------------------------------------------------------------------
create policy "activities_select"
  on public.activities for select
  to authenticated
  using (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or created_by = public.current_profile_id()
      or exists (select 1 from public.contacts c where c.id = activities.contact_id
                   and (c.owner_id = public.current_profile_id() or c.created_by = public.current_profile_id()))
      or exists (select 1 from public.accounts a where a.id = activities.account_id
                   and (a.owner_id = public.current_profile_id() or a.created_by = public.current_profile_id()))
    )
  );

create policy "activities_insert"
  on public.activities for insert
  to authenticated
  with check (
    public.has_verified_mfa() and created_by = public.current_profile_id() and (
      public.is_admin_or_manager()
      or exists (select 1 from public.contacts c where c.id = activities.contact_id
                   and (c.owner_id = public.current_profile_id() or c.created_by = public.current_profile_id()))
      or exists (select 1 from public.accounts a where a.id = activities.account_id
                   and (a.owner_id = public.current_profile_id() or a.created_by = public.current_profile_id()))
    )
  );

create policy "activities_update_own_or_admin"
  on public.activities for update
  to authenticated
  using (public.has_verified_mfa() and (created_by = public.current_profile_id() or public.is_admin_or_manager()))
  with check (public.has_verified_mfa() and (created_by = public.current_profile_id() or public.is_admin_or_manager()));

create policy "activities_delete_admin_only"
  on public.activities for delete
  to authenticated
  using (public.has_verified_mfa() and public.is_admin());

-- ----------------------------------------------------------------------------
-- TASKS  (follow ups)
-- ----------------------------------------------------------------------------
create policy "tasks_select"
  on public.tasks for select
  to authenticated
  using (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or assigned_to = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  );

create policy "tasks_insert"
  on public.tasks for insert
  to authenticated
  with check (public.has_verified_mfa() and created_by = public.current_profile_id());

create policy "tasks_update"
  on public.tasks for update
  to authenticated
  using (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or assigned_to = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  )
  with check (
    public.has_verified_mfa() and (
      public.is_admin_or_manager()
      or assigned_to = public.current_profile_id()
      or created_by = public.current_profile_id()
    )
  );

create policy "tasks_delete"
  on public.tasks for delete
  to authenticated
  using (public.has_verified_mfa() and (public.is_admin_or_manager() or created_by = public.current_profile_id()));

-- ----------------------------------------------------------------------------
-- INVITATIONS  (admin only, end to end)
-- ----------------------------------------------------------------------------
create policy "invitations_admin_only"
  on public.invitations for all
  to authenticated
  using (public.has_verified_mfa() and public.is_admin())
  with check (public.has_verified_mfa() and public.is_admin());

-- ----------------------------------------------------------------------------
-- AUDIT LOGS  (read-only for admin/manager via client; writes via RPC only)
-- ----------------------------------------------------------------------------
create policy "audit_logs_select_admin_manager"
  on public.audit_logs for select
  to authenticated
  using (public.has_verified_mfa() and public.is_admin_or_manager());

-- no insert/update/delete policies for audit_logs -> only the SECURITY DEFINER
-- log_audit_event() function (owned by the table owner) can write rows.
