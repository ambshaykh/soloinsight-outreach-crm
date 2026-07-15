-- ============================================================================
-- Phase 6: Google Sign-In + mandatory passkey, retiring forced TOTP 2FA.
--
-- Design:
--  - profiles.passkey_enrolled tracks whether someone has completed passkey
--    setup. Checked once at sign-in time (in the OAuth callback route), NOT
--    on every request — there's no per-request middleware gate for this,
--    unlike the old TOTP approach.
--  - has_verified_mfa() used to hard-require aal2 (a verified TOTP factor)
--    on almost every RLS policy in the app. That's the actual mechanism
--    that made 2FA "mandatory" — the middleware redirect was just the UI
--    half of it. Retiring TOTP enforcement means this function must change
--    too, or everyone who signs in via Google/passkey (which don't raise
--    aal to aal2) would pass the UI but see an empty app, since every
--    query would get silently filtered to zero rows by RLS.
--  - Nothing about the TOTP tables/data is touched — existing enrollments
--    are left alone, per instruction; they just stop being required.
-- ============================================================================

alter table public.profiles
  add column if not exists passkey_enrolled boolean not null default false;

-- Was: coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'  (required a verified TOTP factor)
-- Now: just requires a signed-in user. Every policy that calls this function
-- is unchanged — only what "verified" means has changed, to match the new
-- Google Sign-In + passkey model instead of the retired mandatory-TOTP one.
create or replace function public.has_verified_mfa()
returns boolean language sql stable as $$
  select auth.uid() is not null;
$$;

-- ----------------------------------------------------------------------------
-- Close a real gap that Google Sign-In introduces: today, the ONLY way to
-- create an auth.users row is through the invite-acceptance page, which
-- checks a valid token before ever calling supabase.auth.signUp() — so
-- handle_new_auth_user()'s "coalesce(inv.role, 'sdr')" fallback has never
-- actually been reachable in practice. Google Sign-In changes that: it lets
-- anyone with a Google account authenticate directly from the public login
-- page, with nothing in front of it to check an invite token first. Without
-- this change, any Google account would silently get an auto-created
-- profile defaulting to the 'sdr' role — this CRM is meant to be invite-only.
--
-- Fix: if there's no matching pending invitation, abort the whole sign-up
-- (raise exception rolls back the auth.users insert too) instead of ever
-- falling back to a default role. Applies to every sign-up path, not just
-- Google — password-based sign-up was never actually exposed without an
-- invite either, so this only removes a fallback that was already
-- unreachable there, while closing the new gap Google Sign-In opens.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv record;
begin
  select * into inv from public.invitations
    where email = new.email and status = 'pending' and expires_at > now()
    order by created_at desc limit 1;

  if inv.id is null then
    raise exception 'not_invited: % has no pending invitation', new.email;
  end if;

  insert into public.profiles (user_id, full_name, email, role, team_id, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    inv.role,
    inv.team_id,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );

  update public.invitations set status = 'accepted' where id = inv.id;

  return new;
end;
$$;
