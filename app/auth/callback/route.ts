import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccessPortal, PORTALS, type PortalSlug } from "@/lib/auth/portals";

/**
 * PKCE callback for Google Sign-In. Supabase's GoTrue handles the actual
 * exchange with Google, creates/looks up the auth.users row (firing
 * handle_new_auth_user(), which now rejects anyone without a matching
 * pending invitation — see 0008_google_sso_passkey.sql), and redirects here
 * with either a `code` to exchange for a session, or an `error` if
 * something upstream (including that invite check) failed.
 *
 * NOTE: this is the one piece of Phase 6 that genuinely needs a live test
 * once Google OAuth is wired up in the Supabase dashboard — the exact
 * error/error_description GoTrue sends back for a rejected sign-up hasn't
 * been confirmed against a real project yet.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
  const portal = url.searchParams.get("portal") as PortalSlug | null;
  const redirectTarget = url.searchParams.get("redirect");

  const loginUrl = (denied: string) => {
    const u = new URL(portal ? `/portal/${portal}/login` : "/", request.url);
    u.searchParams.set("denied", denied);
    return u;
  };

  if (oauthError || !code) {
    return NextResponse.redirect(loginUrl(oauthError?.includes("not_invited") ? "not_invited" : "oauth_error"));
  }

  const supabase = createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(loginUrl("oauth_error"));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(loginUrl("oauth_error"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.redirect(loginUrl("not_invited"));
  }

  if (portal && !canAccessPortal(profile.role, portal)) {
    await supabase.rpc("log_audit_event", {
      p_action: "user.portal_access_denied", p_entity_type: "auth", p_entity_id: null,
      p_metadata: { portal, method: "google" },
    });
    await supabase.auth.signOut();
    return NextResponse.redirect(loginUrl(portal));
  }

  await supabase.rpc("log_audit_event", {
    p_action: "user.login", p_entity_type: "auth", p_entity_id: null, p_metadata: { method: "google", portal },
  });

  const home = (portal && PORTALS[portal]?.home) || "/";
  return NextResponse.redirect(new URL(redirectTarget || home, request.url));
}
