import Link from "next/link";
import { Users, Megaphone, MessageSquareReply, ArrowRight } from "lucide-react";

type SalesforceSummary = { totalLeads: number; campaignsSynced: number; totalResponses: number };

export function SalesforceSummaryWidget({ data }: { data: SalesforceSummary }) {
  if (data.campaignsSynced === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#6B7280]">
        No Salesforce data synced yet. <Link href="/salesforce" className="text-primary hover:underline">Connect an org</Link>.
      </p>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
          <Users className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-lg font-semibold">{data.totalLeads.toLocaleString()}</p>
            <p className="text-[11px] text-[#6B7280]">Leads uploaded</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
          <Megaphone className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-lg font-semibold">{data.campaignsSynced.toLocaleString()}</p>
            <p className="text-[11px] text-[#6B7280]">Campaigns synced</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
          <MessageSquareReply className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-lg font-semibold">{data.totalResponses.toLocaleString()}</p>
            <p className="text-[11px] text-[#6B7280]">Responses</p>
          </div>
        </div>
      </div>
      <Link href="/salesforce" className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        Open Salesforce portal <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
