import { requireRole } from "@/lib/auth/session";
import { listPermissionsCatalog, listRolePermissionsMatrix } from "@/lib/auth/permissions";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RolePermissionsMatrix } from "@/components/settings/role-permissions-matrix";

export default async function RolesPermissionsPage() {
  await requireRole(["admin"]);

  const [permissions, matrix] = await Promise.all([
    listPermissionsCatalog(),
    listRolePermissionsMatrix(),
  ]);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Roles &amp; Permissions</h1>
        <p className="text-sm text-[#6B7280]">
          Control exactly what each role can see and do. Changes apply immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission matrix</CardTitle>
          <CardDescription>
            Salesforce and Executive Dashboard permissions are reserved for upcoming features — toggling them now
            won't do anything visible yet, but the pages that use them will respect these settings once built.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolePermissionsMatrix permissions={permissions} initialGranted={Array.from(matrix)} />
        </CardContent>
      </Card>
    </PageTransition>
  );
}
