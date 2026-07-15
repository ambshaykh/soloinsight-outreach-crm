import { preferenceAttrs } from "@/lib/utils";
import { requirePortalAccess } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { listMyNotifications, countMyUnreadNotifications } from "@/lib/data/notifications";

export default async function SalesPortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePortalAccess("sales");
  const [notifications, unreadCount] = await Promise.all([listMyNotifications(10), countMyUnreadNotifications()]);

  return (
    <div className="app-shell-gradient flex h-screen overflow-hidden">
      <Sidebar role={profile.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar profile={profile} notifications={notifications as any} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-6" {...preferenceAttrs(profile.preferences)}>{children}</main>
      </div>
    </div>
  );
}
