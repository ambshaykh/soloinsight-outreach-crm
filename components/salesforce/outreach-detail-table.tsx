import { cn } from "@/lib/utils";
import type { OutreachMonthGroup } from "@/lib/data/salesforce-outreach";

function fmtNum(v: number | null) {
  return v === null || v === undefined ? "—" : v.toLocaleString();
}
function fmtRate(v: number | null) {
  return v === null || v === undefined ? "—" : `${v.toFixed(1)}%`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/**
 * Per-org, per-day send-batch detail for one month — same shape as the
 * "SI Growth Campaign Roundup" sheet: org / date rows with batches sent vs.
 * blocked, emails sent vs. uploaded, delivery rate, and a grand-total row.
 */
export function OutreachDetailTable({ group }: { group: OutreachMonthGroup }) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-violet-200">
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr>
            <th colSpan={8} className="bg-gradient-to-r from-violet-700 to-fuchsia-700 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white">
              {group.monthLabel} — Salesforce Outreach Detail
            </th>
          </tr>
          <tr className="bg-violet-50">
            <th className="px-3 py-2 text-left text-xs font-semibold text-violet-800">Date</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-violet-800">Campaign</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-violet-800">Org</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-violet-800">Batches Sent</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-violet-800">Batches Blocked</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-violet-800">Emails Sent</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-violet-800">Emails Uploaded</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-violet-800">Delivery Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-violet-100">
          {group.rows.map((r, i) => (
            <tr key={r.id} className={cn(i % 2 === 1 && "bg-violet-50/40")}>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6B7280]">{fmtDate(r.stat_date)}</td>
              <td className="max-w-[260px] px-3 py-2 text-sm text-[#0F1419]">{r.campaign_label}</td>
              <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-[#0F1419]">
                {r.org_label}
                {r.notes && (
                  <span title={r.notes} className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                    note
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-center text-sm">{fmtNum(r.batches_sent)}</td>
              <td className="px-3 py-2 text-center text-sm">{fmtNum(r.batches_blocked)}</td>
              <td className="px-3 py-2 text-center text-sm">{fmtNum(r.emails_sent)}</td>
              <td className="px-3 py-2 text-center text-sm">{fmtNum(r.emails_uploaded)}</td>
              <td className="px-3 py-2 text-center text-sm font-medium text-violet-700">{fmtRate(r.delivery_rate)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-violet-900 text-white">
            <td colSpan={3} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Grand Total — {group.monthLabel}</td>
            <td className="px-3 py-2 text-center text-sm font-semibold">{fmtNum(group.totals.batchesSent)}</td>
            <td className="px-3 py-2 text-center text-sm font-semibold">{fmtNum(group.totals.batchesBlocked)}</td>
            <td className="px-3 py-2 text-center text-sm font-semibold">{fmtNum(group.totals.emailsSent)}</td>
            <td className="px-3 py-2 text-center text-sm font-semibold">{fmtNum(group.totals.emailsUploaded)}</td>
            <td className="px-3 py-2 text-center text-sm font-semibold">—</td>
          </tr>
          <tr>
            <td colSpan={8} className="bg-violet-950 px-4 py-2 text-center text-[11px] font-medium text-violet-300">
              © Soloinsight Inc. — Internal Executive Data — Confidential
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
