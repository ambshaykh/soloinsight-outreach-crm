import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { portalForPath, PORTALS } from "@/lib/auth/portals";

const PUBLIC_PATHS = ["/", "/portal", "/auth/callback", "/invite", "/reset-password", "/login"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => (p === "/" ? path === "/" : path.startsWith(p)));

  // Not signed in and hitting a protected path: bounce to the login page for the
  // portal that path belongs to (falls back to the portal selector if unknown).
  if (!user && !isPublic) {
    const portal = portalForPath(path);
    const url = request.nextUrl.clone();
    url.pathname = portal ? `/portal/${portal}/login` : "/";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && !isPublic && path !== "/2fa/setup") {
    // Determine the session's Authenticator Assurance Level. Supabase issues
    // aal2 only after a TOTP factor has been verified for this session.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = (factors?.totp ?? []).some((f) => f.status === "verified");

    if (!hasVerifiedFactor || aal?.currentLevel !== "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = "/2fa/setup";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
  }

  // Signed in and revisiting a portal login page or the old /login shim: send them
  // straight to that portal's home instead of showing the form again.
  if (user && path.startsWith("/portal/") && path.endsWith("/login")) {
    const slug = path.split("/")[2] as keyof typeof PORTALS | undefined;
    const url = request.nextUrl.clone();
    url.pathname = (slug && PORTALS[slug]?.home) || "/";
    return NextResponse.redirect(url);
  }
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
