import { preferenceAttrs } from "@/lib/utils";
import { requirePortalAccess } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { listMyNotifications, countMyUnreadNotifications } from "@/lib/data/notifications";

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePortalAccess("admin");
  const [notifications, unreadCount] = await Promise.all([listMyNotifications(10), countMyUnreadNotifications()]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F3FF]">
      <AdminSidebar role={profile.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar profile={profile} notifications={notifications as any} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-6" {...preferenceAttrs(profile.preferences)}>{children}</main>
      </div>
    </div>
  );
}
