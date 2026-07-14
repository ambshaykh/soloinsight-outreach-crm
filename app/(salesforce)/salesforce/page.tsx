import { CheckCircle2, AlertTriangle, Users, Megaphone, MessageSquareReply, Info } from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";
import { listSalesforceOrgStatuses, listSalesforceCampaignStats } from "@/app/actions/salesforce";
import { OrgConnections } from "@/components/salesforce/org-connections";
import { SchemaDiscoveryPanel } from "@/components/salesforce/schema-discovery-panel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function SalesforcePortalHome({
  searchParams,
}: {
  searchParams: { connected?: string; connect_error?: string };
}) {
  const canManage = await hasPermission("salesforce.manage_connections");
  const [orgs, stats] = await Promise.all([listSalesforceOrgStatuses(), listSalesforceCampaignStats()]);

  const totalLeads = stats.reduce((sum: number, s: any) => sum + (s.leads_uploaded ?? 0), 0);
  const totalResponses = stats.reduce((sum: number, s: any) => sum + (s.responded_count ?? 0), 0);
  const campaignsSynced = stats.length;

  return (
    <div className="p-6 text-[#0F1419]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Salesforce</h1>
          <p className="text-sm text-[#6B7280]">Connected orgs and synced campaign data.</p>
        </div>
      </div>

      {searchParams.connected && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Org connected. Click "Sync now" to pull its first snapshot.
        </div>
      )}
      {searchParams.connect_error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
          <AlertTriangle className="h-4 w-4" /> Couldn't connect: {searchParams.connect_error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><Users className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-semibold">{totalLeads.toLocaleString()}</p>
              <p className="text-xs text-[#6B7280]">Total leads uploaded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><Megaphone className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-semibold">{campaignsSynced.toLocaleString()}</p>
              <p className="text-xs text-[#6B7280]">Campaigns synced</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><MessageSquareReply className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-semibold">{totalResponses.toLocaleString()}</p>
              <p className="text-xs text-[#6B7280]">Total responses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connected orgs</CardTitle>
          <CardDescription>
            {canManage
              ? "Add a Connected App's credentials, then click Connect to authorize."
              : "Ask a Salesforce Admin to connect an org."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgConnections orgs={orgs} canManage={canManage} />
        </CardContent>
      </Card>

      <Card className="mb-6 border-amber-200 bg-amber-50/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              <strong>Emails sent, bounce rate, and unsubscribes aren't synced yet.</strong> Vanilla Salesforce
              Campaigns don't track those out of the box — it depends on whether your orgs send campaign email via
              classic Mass Email, Lightning "List Email," or something custom. Run the scan below against a
              connected org to see what's actually there.
            </p>
          </div>
          <SchemaDiscoveryPanel orgs={orgs.filter((o: any) => o.status === "connected").map((o: any) => ({ id: o.id, label: o.label }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synced campaigns</CardTitle>
          <CardDescription>{campaignsSynced} campaign{campaignsSynced === 1 ? "" : "s"} synced across all connected orgs.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#6B7280]">No campaign data synced yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>Leads uploaded</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm font-medium">{s.campaign_name}</TableCell>
                    <TableCell className="text-sm text-[#6B7280]">{s.campaign_status ?? "—"}</TableCell>
                    <TableCell className="text-sm text-[#6B7280]">{s.start_date ?? "—"}</TableCell>
                    <TableCell className="text-sm">{s.leads_uploaded}</TableCell>
                    <TableCell className="text-sm">{s.responded_count}</TableCell>
                    <TableCell className="text-xs text-[#6B7280]">{new Date(s.synced_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
