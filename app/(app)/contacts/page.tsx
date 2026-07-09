import { Suspense } from "react";
import { listContacts } from "@/lib/data/contacts";
import { PageTransition } from "@/components/shared/page-transition";
import { TableFilters } from "@/components/shared/table-filters";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { CONTACT_STATUS_LABELS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ContactsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const contacts = await listContacts({
    search: searchParams.search,
    status: searchParams.status,
    priority: searchParams.priority,
  });

  return (
    <PageTransition>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#0F1419]">Contacts</h1>
          <p className="text-sm text-[#6B7280]">{contacts.length} people across your accounts.</p>
        </div>
        <ContactFormDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-96" />}>
        <TableFilters
          searchPlaceholder="Search name or email…"
          filters={[
            { key: "status", label: "Status", options: Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
            { key: "priority", label: "Priority", options: [
              { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
              { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
            ] },
          ]}
        />
      </Suspense>

      <ContactsTable contacts={contacts as any} />
    </PageTransition>
  );
}
