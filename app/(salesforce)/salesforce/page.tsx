import Link from "next/link";
import { CheckCircle2, AlertTriangle, Users, Megaphone, MessageSquareReply, Info, Trophy, ListChecks, ArrowRight } from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";
import { listSalesforceOrgStatuses, listSalesforceCampaignStats } from "@/app/actions/salesforce";
import { OrgConnections } from "@/components/salesforce/org-connections";
import { SchemaDiscoveryPanel } from "@/components/salesforce/schema-discovery-panel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MEDAL_STYLES = [
  "bg-gradient-to-br from-amber-300 to-amber-500 text-white",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white",
  "bg-gradient-to-br from-orange-300 to-orange-500 text-white",
];

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

  // "Response rate" only means anything for campaigns that actually have
  // synced email-send counts (see the schema-discovery note below — most
  // orgs won't, out of the box). Ranking is real, not estimated, and only
  // considers campaigns where we genuinely have a denominator.
  const topCampaigns = [...stats]
    .filter((s: any) => (s.emails_sent ?? 0) > 0)
    .map((s: any) => ({ ...s, responseRate: Math.round((s.responded_count / s.emails_sent) * 1000) / 10 }))
    .sort((a: any, b: any) => b.responseRate - a.responseRate)
    .slice(0, 5);

  return (
    <div className="p-6 text-[#0F1419]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Salesforce</h1>
          <p className="text-sm text-[#6B7280]">Connected orgs and synced campaign data.</p>
        </div>
        <Link
          href="/salesforce/outreach-detail"
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <ListChecks className="h-4 w-4" /> View outreach detail <ArrowRight className="h-3.5 w-3.5" />
        </Link>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-50 to-violet-100"><Users className="h-5 w-5 text-violet-700" /></div>
            <div>
              <p className="text-2xl font-semibold">{totalLeads.toLocaleString()}</p>
              <p className="text-xs text-[#6B7280]">Total leads uploaded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-50 to-fuchsia-100"><Megaphone className="h-5 w-5 text-fuchsia-700" /></div>
            <div>
              <p className="text-2xl font-semibold">{campaignsSynced.toLocaleString()}</p>
              <p className="text-xs text-[#6B7280]">Campaigns synced</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100"><MessageSquareReply className="h-5 w-5 text-indigo-700" /></div>
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

      {topCampaigns.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-violet-600" /> Top performing campaigns</CardTitle>
            <CardDescription>Ranked by response rate — only counts campaigns with synced email-send data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCampaigns.map((c: any, i: number) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-violet-100 px-3 py-2">
                {i < 3 ? (
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", MEDAL_STYLES[i])}>{i + 1}</span>
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">{i + 1}</span>
                )}
                <span className="flex-1 truncate text-sm font-medium">{c.campaign_name}</span>
                <span className="text-xs text-[#6B7280]">{c.responded_count} / {c.emails_sent} sent</span>
                <span className="text-sm font-semibold text-violet-700">{c.responseRate}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border-indigo-200 bg-indigo-50/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <p className="text-xs text-indigo-800">
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
                  <TableHead>Leads uploaded</TableHead>
                  <TableHead>Emails sent</TableHead>
                  <TableHead>Bounce rate</TableHead>
                  <TableHead>Unsub rate</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s: any) => {
                  const hasEmailData = (s.emails_sent ?? 0) > 0;
                  const bounceRate = hasEmailData ? Math.round((s.bounced_count / s.emails_sent) * 1000) / 10 : null;
                  const unsubRate = hasEmailData ? Math.round((s.unsubscribed_count / s.emails_sent) * 1000) / 10 : null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">{s.campaign_name}</TableCell>
                      <TableCell className="text-sm text-[#6B7280]">{s.campaign_status ?? "—"}</TableCell>
                      <TableCell className="text-sm">{s.leads_uploaded}</TableCell>
                      <TableCell className="text-sm text-[#6B7280]">{hasEmailData ? s.emails_sent : "Not synced"}</TableCell>
                      <TableCell className="text-sm text-[#6B7280]">{bounceRate !== null ? `${bounceRate}%` : "—"}</TableCell>
                      <TableCell className="text-sm text-[#6B7280]">{unsubRate !== null ? `${unsubRate}%` : "—"}</TableCell>
                      <TableCell className="text-sm">{s.responded_count}</TableCell>
                      <TableCell className="text-xs text-[#6B7280]">{new Date(s.synced_at).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
