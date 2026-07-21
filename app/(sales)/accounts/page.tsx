import { Suspense } from "react";
import { listAccounts } from "@/lib/data/accounts";
import { listProfiles } from "@/lib/data/profiles";
import { PageTransition } from "@/components/shared/page-transition";
import { TableFilters } from "@/components/shared/table-filters";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { ACCOUNT_STATUS_LABELS, INDUSTRIES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AccountsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const [accounts, profiles] = await Promise.all([
    listAccounts({
      search: searchParams.search,
      status: searchParams.status,
      industry: searchParams.industry,
      priority: searchParams.priority,
      owner: searchParams.owner,
    }),
    listProfiles(),
  ]);

  return (
    <PageTransition>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#0F1419]">Accounts</h1>
          <p className="text-sm text-[#6B7280]">{accounts.length} companies in your outreach pipeline.</p>
        </div>
        <AccountFormDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-96" />}>
        <TableFilters
          searchPlaceholder="Search company name…"
          filters={[
            { key: "status", label: "Status", options: Object.entries(ACCOUNT_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
            { key: "industry", label: "Industry", options: INDUSTRIES.map((i) => ({ value: i, label: i })) },
            { key: "priority", label: "Priority", options: [
              { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
              { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
            ] },
            { key: "owner", label: "Assigned to", options: profiles.map((p) => ({ value: p.id, label: p.full_name })) },
          ]}
        />
      </Suspense>

      <AccountsTable accounts={accounts as any} />
    </PageTransition>
  );
}
