import Link from "next/link";
import { requireProfile, canManageTeam } from "@/lib/auth/session";
import { listTeams } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SecurityStatusBadge } from "@/components/shared/security-status-badge";
import { DataImportExport } from "@/components/settings/data-import-export";
import { ROLE_LABELS } from "@/lib/constants";
import { updateOwnProfile, createTeam } from "@/app/actions/users";
import { Users, ShieldCheck, Database, Building } from "lucide-react";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const canManage = canManageTeam(profile.role);
  const teams = canManage ? await listTeams() : [];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Settings</h1>
        <p className="text-sm text-[#6B7280]">Manage your profile, workspace, and data.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateOwnProfile} className="space-y-3">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={profile.email} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={ROLE_LABELS[profile.role]} disabled />
              </div>