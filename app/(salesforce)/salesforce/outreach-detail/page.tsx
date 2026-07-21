import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { getSalesforceOutreachDetail } from "@/lib/data/salesforce-outreach";
import { OutreachDetailTable } from "@/components/salesforce/outreach-detail-table";

export default async function SalesforceOutreachDetailPage() {
  const groups = await getSalesforceOutreachDetail();

  return (
    <div className="p-6 text-[#0F1419]">
      <Link href="/salesforce" className="mb-4 flex w-fit items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#0F1419]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Salesforce
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700">
          <ListChecks className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Outreach Detail</h1>
          <p className="text-sm text-[#6B7280]">
            Per-org send-batch detail across your 3 connected Salesforce orgs — batches sent vs. blocked, emails
            sent vs. uploaded, and delivery rate, day by day.
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#6B7280]">
          No outreach detail synced yet. This fills in as your Salesforce sync or your own workflow writes rows into
          <code className="mx-1 rounded bg-violet-50 px-1.5 py-0.5 text-xs text-violet-700">salesforce_outreach_daily_stats</code>.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <OutreachDetailTable key={g.monthKey} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
