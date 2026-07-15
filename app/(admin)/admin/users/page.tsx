import { requireRole } from "@/lib/auth/session";
import { listProfiles, listInvitations } from "@/lib/data/profiles";
import { getLastSignInMap } from "@/app/actions/users";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/shared/stat-tile";
import { UsersTable } from "@/components/settings/users-table";
import { InviteUserForm } from "@/components/settings/invite-user-form";
import { InvitationsList } from "@/components/settings/invitations-list";
import { ROLE_LABELS } from "@/lib/constants";
import { Users, ShieldCheck, UserCheck, UserX } from "lucide-react";
import type { UserRole } from "@/lib/types/database";

export default async function UsersSettingsPage() {
  const profile = await requireRole(["admin", "manager"]);
  const isAdmin = profile.role === "admin";
  const [profiles, invitations, lastSignIn] = await Promise.all([
    listProfiles(),
    isAdmin ? listInvitations() : Promise.resolve([]),
    isAdmin ? getLastSignInMap() : Promise.resolve({}),
  ]);

  const activeCount = profiles.filter((p) => p.is_active).length;
  const twoFaCount = profiles.filter((p) => p.two_factor_enabled).length;
  const pendingInvites = invitations.filter((i: any) => i.status === "pending").length;
  const roleCounts = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1;
    return acc;
  }, {});
  const topRoles = (Object.entries(roleCounts) as [UserRole, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">User Management</h1>
        <p className="text-sm text-[#6B7280]">Invite teammates, manage roles, and control access.</p>
      </div>

      {isAdmin && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={Users} label="Total users" value={profiles.length} tone="primary" />
          <StatTile icon={UserCheck} label="Active" value={activeCount} sublabel={`${profiles.length - activeCount} inactive`} tone="success" />
          <StatTile icon={ShieldCheck} label="2FA enabled" value={twoFaCount} sublabel={`of ${profiles.length}`} tone={twoFaCount === profiles.length ? "success" : "warning"} />
          <StatTile
            icon={UserX}
            label="Pending invites"
            value={pendingInvites}
            sublabel={topRoles.map(([r, c]) => `${c} ${ROLE_LABELS[r]}`).join(" · ")}
            tone="neutral"
          />
        </div>
      )}

      <div className="space-y-6">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Invite a teammate</CardTitle>
              <CardDescription>Only admins can invite new users. They'll set a password and must enable 2FA before accessing the CRM.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InviteUserForm />
              <InvitationsList invitations={invitations} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Team members ({profiles.length})</CardTitle>
            <CardDescription>
              {isAdmin ? "Change roles and deactivate access. Deactivating also revokes their live session." : "View-only — ask an admin to change roles."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable profiles={profiles} isAdmin={isAdmin} currentUserId={profile.id} lastSignIn={lastSignIn} />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
