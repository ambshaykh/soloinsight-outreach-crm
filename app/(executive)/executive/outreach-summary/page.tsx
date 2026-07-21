import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { getOutreachSummaryYears, getOutreachSummaryForYear } from "@/lib/data/outreach-summary";
import { OutreachSummaryTable } from "@/components/executive/outreach-summary-table";
import { OutreachSummaryExportButton } from "@/components/executive/outreach-summary-export-button";
import { cn } from "@/lib/utils";

export default async function OutreachSummaryPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const years = await getOutreachSummaryYears();
  const requestedYear = searchParams.year ? Number(searchParams.year) : undefined;
  const year = requestedYear && years.includes(requestedYear) ? requestedYear : years[years.length - 1];
  const rows = year ? await getOutreachSummaryForYear(year) : [];

  return (
    <div>
      <Link href="/executive" className="mb-4 flex w-fit items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#0F1419]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-[#0F1419]">Outreach Summary</h1>
            <p className="text-sm text-[#6B7280]">
              Company-wide monthly campaign outreach — same 18 metrics your ops team has tracked since Jun-23.
            </p>
          </div>
        </div>
        {year && rows.length > 0 && <OutreachSummaryExportButton year={year} rows={rows} />}
      </div>

      {years.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#6B7280]">No outreach data yet.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {years.map((y) => (
              <Link
                key={y}
                href={`/executive/outreach-summary?year=${y}`}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  y === year
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm"
                    : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                )}
              >
                {y}
              </Link>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6B7280]">No rows for {year} yet.</p>
          ) : (
            <OutreachSummaryTable year={year!} rows={rows} />
          )}

          <p className="mt-4 text-xs text-[#8B95A5]">
            Jun-23 through Dec-25 comes from the master rollup your ops team maintains. Months marked "partial" are
            derived from that month's own daily log because the rollup hasn't caught up yet — a few rows (contact
            target, businesses reached, and the qualitative context rows) aren't available for those months until it
            does, or until your own workflow backfills them.
          </p>
        </>
      )}
    </div>
  );
}
