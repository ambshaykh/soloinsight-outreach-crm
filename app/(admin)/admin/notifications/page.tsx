import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listNotificationTemplates } from "@/lib/data/notifications";
import { PageTransition } from "@/components/shared/page-transition";
import { PermissionDeniedState } from "@/components/shared/state-patterns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NotificationTemplatesTable } from "@/components/settings/notification-templates-table";

export default async function NotificationsTemplatesPage() {
  await requireProfile();
  const canManage = await hasPermission("notifications.manage");
  const templates = await listNotificationTemplates();

  if (!canManage) {
    return (
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0F1419]">Notifications &amp; Templates</h1>
        </div>
        <PermissionDeniedState />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Notifications &amp; Templates</h1>
        <p className="text-sm text-[#6B7280]">
          Source of truth for every in-app notification the CRM fires. Edit the copy, or turn an event off entirely.
          Changes apply to the next matching event and are logged to the audit log.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template library</CardTitle>
          <CardDescription>
            Variables use <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">{"{{name}}"}</code> syntax and are filled in at send time.
            Email-channel templates are ready to go but won't actually deliver until an email provider is connected —
            everything below fires in-app today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationTemplatesTable templates={templates as any} />
        </CardContent>
      </Card>
    </PageTransition>
  );
}
