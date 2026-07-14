import Link from "next/link";
import { ArrowLeftRight, LogOut, UserCircle } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { signOut } from "@/app/actions/auth";
import { portalsForRole } from "@/lib/auth/portals";
import type { Profile } from "@/lib/types/database";

export function PortalPlaceholderShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const hasMultiplePortals = portalsForRole(profile.role).length > 1;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/5 px-6">
        <Logo className="text-white" />
        <div className="flex items-center gap-4 text-xs font-medium text-white/60">
          <Link href="/account" className="flex items-center gap-1.5 hover:text-white">
            <UserCircle className="h-3.5 w-3.5" /> Account
          </Link>
          {hasMultiplePortals && (
            <Link href="/" className="flex items-center gap-1.5 hover:text-white">
              <ArrowLeftRight className="h-3.5 w-3.5" /> Switch portal
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-1.5 text-rose-300 hover:text-rose-200">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">{children}</main>
    </div>
  );
}
