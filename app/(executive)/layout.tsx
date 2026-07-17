import { preferenceAttrs } from "@/lib/utils";
import { requirePortalAccess } from "@/lib/auth/session";
import { ExecutiveSidebar } from "@/components/layout/executive-sidebar";
import { PortalTopbar } from "@/components/layout/portal-topbar";
import { PageTransition } from "@/components/shared/page-transition";
import { listMyNotifications, countMyUnreadNotifications } from "@/lib/data/notifications";

export default async function ExecutivePortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePortalAccess("executive");
  const [notifications, unreadCount] = await Promise.all([listMyNotifications(10), countMyUnreadNotifications()]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F3FF]">
      <ExecutiveSidebar role={profile.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalTopbar title="Executive Dashboard" profile={profile} notifications={notifications as any} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-6" {...preferenceAttrs(profile.preferences)}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
