import { requirePortalAccess } from "@/lib/auth/session";
import { portalsForRole } from "@/lib/auth/portals";
import { listMyNotifications, countMyUnreadNotifications } from "@/lib/data/notifications";
import { PortalTopbar } from "@/components/layout/portal-topbar";
import { PageTransition } from "@/components/shared/page-transition";
import { preferenceAttrs } from "@/lib/utils";

export default async function SalesforcePortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePortalAccess("salesforce");
  const hasMultiplePortals = portalsForRole(profile.role).length > 1;
  const [notifications, unreadCount] = await Promise.all([listMyNotifications(10), countMyUnreadNotifications()]);

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <PortalTopbar
        title="Salesforce"
        profile={profile}
        notifications={notifications as any}
        unreadCount={unreadCount}
        showSwitchPortal={hasMultiplePortals}
      />
      <main {...preferenceAttrs(profile.preferences)}>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
