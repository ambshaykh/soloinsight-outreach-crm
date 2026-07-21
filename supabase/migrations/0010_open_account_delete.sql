-- Phase 12: open account deletion to all authenticated (MFA-verified) users,
-- matching the same widening contacts already got in
-- 0003_open_contact_delete.sql. Needed so the new bulk-delete feature on the
-- Sales portal's Accounts table works for every Sales portal user, not just
-- admins — accounts were still admin-only at the RLS layer even though
-- contacts were opened up earlier.
drop policy if exists "accounts_delete_admin_only" on public.accounts;

create policy "accounts_delete_any_user"
  on public.accounts for delete
  to authenticated
  using (public.has_verified_mfa());
