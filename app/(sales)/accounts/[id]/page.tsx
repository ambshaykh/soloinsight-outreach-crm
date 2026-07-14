import { notFound } from "next/navigation";
import { getAccountById, getAccountActivity } from "@/lib/data/accounts";
import { PageTransition } from "@/components/shared/page-transition";
import { AccountDetailHeader } from "@/components/accounts/account-detail-header";
import { ContactsMiniList } from "@/components/contacts/contacts-mini-list";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function AccountDetailPage({ params }: { params: { id: string } }) {
  let account;
  try {
    account = await getAccountById(params.id);
  } catch {
    return notFound();
  }
  if (!account) return notFound();

  const activity = await getAccountActivity(params.id);

  return (
    <PageTransition>
      <AccountDetailHeader account={account} owner={account.owner ?? null} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Contacts ({account.contacts?.length ?? 0})</CardTitle>
              <ContactFormDialog defaultAccountId={account.id} defaultAccountLabel={account.company_name} />
            </CardHeader>
            <CardContent>
              <ContactsMiniList contacts={account.contacts ?? []} accountId={account.id} />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Outreach History</CardTitle></CardHeader>
            <CardContent><ActivityTimeline activities={activity} /></CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
