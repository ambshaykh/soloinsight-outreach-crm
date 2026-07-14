import { requireRole } from "@/lib/auth/session";
import { listProfiles, listInvitations } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UsersTable } from "@/components/settings/users-table";
import { InviteUserForm } from "@/components/settings/invite-user-form";
import { InvitationsList } from "@/components/settings/invitations-list";

export default async function UsersSettingsPage() {
  const profile = await requireRole(["admin", "manager"]);
  const isAdmin = profile.role === "admin";
  const [profiles, invitations] = await Promise.all([listProfiles(), isAdmin ? listInvitations() : Promise.resolve([])]);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">User Management</h1>
        <p className="text-sm text-[#6B7280]">Invite teammates, manage roles, and control access.</p>
      </div>

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
              {isAdmin ? "Change roles and deactivate access." : "View-only — ask an admin to change roles."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable profiles={profiles} isAdmin={isAdmin} currentUserId={profile.id} />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
