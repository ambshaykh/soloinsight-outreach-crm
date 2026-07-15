import Link from "next/link";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { requirePortalAccess } from "@/lib/auth/session";
import { Logo } from "@/components/shared/logo";
import { signOut } from "@/app/actions/auth";
import { portalsForRole } from "@/lib/auth/portals";
import { listMyNotifications, countMyUnreadNotifications } from "@/lib/data/notifications";
import { NotificationsBell } from "@/components/shared/notifications-bell";
import { preferenceAttrs } from "@/lib/utils";

export default async function SalesforcePortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePortalAccess("salesforce");
  const hasMultiplePortals = portalsForRole(profile.role).length > 1;
  const [notifications, unreadCount] = await Promise.all([listMyNotifications(10), countMyUnreadNotifications()]);

  return (
    <div className="min-h-screen bg-[#F0FDF9]">
      <header className="flex h-16 items-center justify-between border-b border-emerald-100 bg-white/80 px-6 backdrop-blur">
        <Logo className="text-[#0F1419]" />
        <div className="flex items-center gap-4 text-xs font-medium text-[#6B7280]">
          <NotificationsBell initialNotifications={notifications as any} initialUnreadCount={unreadCount} />
          <Link href="/account" className="hover:text-[#0F1419]">Account</Link>
          {hasMultiplePortals && (
            <Link href="/" className="flex items-center gap-1.5 hover:text-[#0F1419]">
              <ArrowLeftRight className="h-3.5 w-3.5" /> Switch portal
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </header>
      <main {...preferenceAttrs(profile.preferences)}>{children}</main>
    </div>
  );
}
