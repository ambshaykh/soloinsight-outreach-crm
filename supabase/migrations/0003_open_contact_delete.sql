-- Open contact deletion to all authenticated (MFA-verified) users, not just admins.
drop policy if exists "contacts_delete_admin_only" on public.contacts;

create policy "contacts_delete_any_user"
  on public.contacts for delete
  to authenticated
  using (public.has_verified_mfa());
