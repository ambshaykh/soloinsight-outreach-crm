-- ============================================================================
-- RBAC foundation: new roles + a configurable permission matrix.
--
-- Design:
--  - Extends user_role with 3 new roles (executive, salesforce_admin,
--    salesforce_viewer) alongside the existing admin/manager/sdr.
--  - `permissions` is a catalog of every permission key the app understands.
--    Some are already enforced (the ones under "Team & Admin"); others
--    (Salesforce / Executive Dashboard) are reserved now and will be wired
--    up to real pages in later phases.
--  - `role_permissions` is a sparse presence table: a row means that role
--    HAS that permission. No row = does not have it. Admins can edit this
--    from Settings -> Roles & Permissions.
--  - `is_admin()` always bypasses the matrix (hardcoded), so a misconfigured
--    matrix can never lock every admin out of managing it.
-- ============================================================================

alter type public.user_role add value if not exists 'executive';
alter type public.user_role add value if not exists 'salesforce_admin';
alter type public.user_role add value if not exists 'salesforce_viewer';

create table if not exists public.permissions (
  key text primary key,
  label text not null,
  description text,
  category text not null,
  sort_order int not null default 0
);

create table if not exists public.role_permissions (
  role public.user_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role, permission_key)
);

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

create policy "permissions_select_all_authenticated"
  on public.permissions for select
  to authenticated
  using (true);

create policy "role_permissions_select_all_authenticated"
  on public.role_permissions for select
  to authenticated
  using (true);

create policy "role_permissions_write_admin_only"
  on public.role_permissions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Checks the matrix for the CURRENT user's role. Admins always pass,
-- regardless of what the matrix says, so the system can never lock out
-- every admin at once.
create or replace function public.has_permission(p_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.role_permissions rp
      where rp.role = public.current_role() and rp.permission_key = p_key
    );
$$;

-- ---------------------------------------------------------------------------
-- Seed the permission catalog
-- ---------------------------------------------------------------------------
insert into public.permissions (key, label, description, category, sort_order) values
  ('accounts.view',    'View accounts',            'See accounts in the pipeline.',                      'Accounts',   10),
  ('accounts.edit',    'Create / edit accounts',   'Add new accounts and edit existing ones.',            'Accounts',   20),
  ('accounts.delete',  'Delete accounts',          'Permanently remove accounts.',                        'Accounts',   30),
  ('contacts.view',    'View contacts',            'See contacts in the pipeline.',                       'Contacts',   10),
  ('contacts.edit',    'Create / edit contacts',   'Add new contacts and edit existing ones.',            'Contacts',   20),
  ('contacts.delete',  'Delete contacts',          'Permanently remove contacts.',                        'Contacts',   30),
  ('activities.log',   'Log activities',           'Log emails, calls, and other outreach touches.',      'Activities', 10),
  ('tasks.manage',     'Manage follow-up tasks',   'Complete, snooze, and reassign follow-up tasks.',     'Activities', 20),
  ('analytics.view',   'View analytics',           'See the Analytics & reporting pages.',                'Analytics',  10),
  ('users.manage',     'Invite / manage users',    'Invite teammates and change their roles.',            'Team & Admin', 10),
  ('teams.manage',     'Manage teams',             'Create and manage workspace teams.',                  'Team & Admin', 20),
  ('roles.manage',     'Edit role permissions',    'Edit this very permission matrix. Admins always keep this regardless of the toggle below.', 'Team & Admin', 30),
  ('audit_logs.view',  'View audit logs',          'See the security/audit log history.',                 'Team & Admin', 40),
  ('salesforce.view',  'View Salesforce data',     'See synced Salesforce campaign & lead data. (Reserved — Salesforce sync not built yet.)', 'Salesforce', 10),
  ('salesforce.manage_connections', 'Manage Salesforce connections', 'Connect/disconnect Salesforce orgs and trigger syncs. (Reserved.)', 'Salesforce', 20),
  ('executive_dashboard.view', 'View executive dashboard', 'See the executive-only dashboard. (Reserved — not built yet.)', 'Executive Dashboard', 10),
  ('executive_dashboard.edit_layout', 'Edit dashboard layout', 'Rearrange widgets on the executive dashboard. (Reserved.)', 'Executive Dashboard', 20)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Seed default role_permissions, matching current real-world behavior for
-- the existing 3 roles, plus sensible starting points for the 3 new roles.
-- All of this stays fully editable afterwards from the Roles & Permissions page.
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role, permission_key)
values
  -- admin: full catalog (also always bypasses via has_permission(), this is just for UI consistency)
  ('admin','accounts.view'), ('admin','accounts.edit'), ('admin','accounts.delete'),
  ('admin','contacts.view'), ('admin','contacts.edit'), ('admin','contacts.delete'),
  ('admin','activities.log'), ('admin','tasks.manage'),
  ('admin','analytics.view'),
  ('admin','users.manage'), ('admin','teams.manage'), ('admin','roles.manage'), ('admin','audit_logs.view'),
  ('admin','salesforce.view'), ('admin','salesforce.manage_connections'),
  ('admin','executive_dashboard.view'), ('admin','executive_dashboard.edit_layout'),

  -- manager: matches current behavior (no user invites, no role editing, no team creation today)
  ('manager','accounts.view'), ('manager','accounts.edit'),
  ('manager','contacts.view'), ('manager','contacts.edit'), ('manager','contacts.delete'),
  ('manager','activities.log'), ('manager','tasks.manage'),
  ('manager','analytics.view'), ('manager','audit_logs.view'),

  -- sdr: matches current behavior
  ('sdr','accounts.view'), ('sdr','accounts.edit'),
  ('sdr','contacts.view'), ('sdr','contacts.edit'), ('sdr','contacts.delete'),
  ('sdr','activities.log'), ('sdr','tasks.manage'),

  -- executive: read-only across the board, plus the two dashboards
  ('executive','accounts.view'), ('executive','contacts.view'),
  ('executive','analytics.view'), ('executive','salesforce.view'),
  ('executive','executive_dashboard.view'), ('executive','executive_dashboard.edit_layout'),

  -- salesforce_admin: baseline CRM read/write + full Salesforce control
  ('salesforce_admin','accounts.view'), ('salesforce_admin','contacts.view'),
  ('salesforce_admin','salesforce.view'), ('salesforce_admin','salesforce.manage_connections'),

  -- salesforce_viewer: read-only Salesforce + baseline CRM read
  ('salesforce_viewer','accounts.view'), ('salesforce_viewer','contacts.view'),
  ('salesforce_viewer','salesforce.view')
on conflict do nothing;
