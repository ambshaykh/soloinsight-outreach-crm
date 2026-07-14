-- Phase 4: per-user layout for the executive dashboard's drag-and-drop grid.
-- One row per person, holding their widget order + sizes as JSON. Reading
-- your own row is always allowed; writing requires the
-- executive_dashboard.edit_layout permission (seeded in Phase 1).

create table if not exists public.executive_dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  layout jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.executive_dashboard_layouts enable row level security;

create policy "exec_layout_select_own"
  on public.executive_dashboard_layouts for select
  to authenticated
  using (profile_id = public.current_profile_id());

create policy "exec_layout_write_own"
  on public.executive_dashboard_layouts for all
  to authenticated
  using (profile_id = public.current_profile_id() and public.has_permission('executive_dashboard.edit_layout'))
  with check (profile_id = public.current_profile_id() and public.has_permission('executive_dashboard.edit_layout'));
