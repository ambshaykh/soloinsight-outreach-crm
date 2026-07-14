import Link from "next/link";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { requireProfile, defaultHomeForRole } from "@/lib/auth/session";
import { Logo } from "@/components/shared/logo";
import { signOut } from "@/app/actions/auth";

// Personal account settings (profile, password, 2FA) live outside any one
// portal's shell — every signed-in user can reach them regardless of which
// portal(s) their role has access to.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const home = defaultHomeForRole(profile.role);

  return (
    <div className="app-shell-gradient min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
        <Logo className="text-[#0F1419]" />
        <div className="flex items-center gap-4">
          <Link href={home} className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#0F1419]">
            <ArrowLeftRight className="h-3.5 w-3.5" /> Back to my portal
          </Link>
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
