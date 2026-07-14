import Link from "next/link";
import { ArrowRight, Lock, Building2, Users2, Cloud, LineChart } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { getCurrentProfile } from "@/lib/auth/session";
import { PORTAL_SLUGS, PORTALS, canAccessPortal } from "@/lib/auth/portals";
import { ROLE_LABELS } from "@/lib/constants";

const PORTAL_ICONS = {
  sales: Building2,
  admin: Users2,
  salesforce: Cloud,
  executive: LineChart,
} as const;

export default async function PortalSelectorPage({
  searchParams,
}: {
  searchParams: { denied?: string };
}) {
  const profile = await getCurrentProfile();
  const deniedPortal = searchParams.denied ? PORTALS[searchParams.denied as keyof typeof PORTALS] : null;

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#0a0e1a] px-6 py-14 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.18),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(109,40,217,0.18),transparent_40%)]" />

      <div className="relative z-10 w-full max-w-5xl">
        <Logo className="text-white" />
      </div>

      <div className="relative z-10 mt-14 max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Soloinsight Outreach Platform</p>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Which portal do you need?</h1>
        <p className="mt-3 text-sm text-white/60">
          {profile
            ? `Signed in as ${profile.full_name} (${ROLE_LABELS[profile.role]}). Choose a portal below.`
            : "Select a portal to sign in. Each one uses your same Soloinsight account."}
        </p>
      </div>

      {deniedPortal && (
        <div className="relative z-10 mt-6 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          <Lock className="h-3.5 w-3.5" />
          Your account doesn't have access to the {deniedPortal.name} portal.
        </div>
      )}

      <div className="relative z-10 mt-10 grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
        {PORTAL_SLUGS.map((slug) => {
          const portal = PORTALS[slug];
          const Icon = PORTAL_ICONS[slug];
          const allowed = profile ? canAccessPortal(profile.role, slug) : true;
          const href = profile && allowed ? portal.home : `/portal/${slug}/login`;

          const card = (
            <div
              className={[
                "group relative flex h-full flex-col rounded-2xl border p-6 transition-all",
                allowed
                  ? "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                  : "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-5 w-5" />
                </div>
                {allowed ? (
                  <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white/80" />
                ) : (
                  <Lock className="h-4 w-4 text-white/30" />
                )}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{portal.name}</h2>
              <p className="mt-1 text-sm text-white/60">{portal.description}</p>
              {!allowed && <p className="mt-3 text-[11px] font-medium text-white/40">No access with your current role</p>}
            </div>
          );

          return allowed ? (
            <Link key={slug} href={href} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={slug} aria-disabled className="h-full">
              {card}
            </div>
          );
        })}
      </div>

      <p className="relative z-10 mt-12 text-xs text-white/40">
        This CRM is invite-only. Ask your admin for an invite link if you don't have an account yet.
      </p>
    </div>
  );
}
