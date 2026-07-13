import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { getContactById, getContactActivity, getContactTasks } from "@/lib/data/contacts";
import { PageTransition } from "@/components/shared/page-transition";
import { ContactDetailHeader } from "@/components/contacts/contact-detail-header";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { TaskMiniList } from "@/components/shared/task-mini-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  await requireProfile();

  let contact;
  try {
    contact = await getContactById(params.id);
  } catch {
    return notFound();
  }
  if (!contact) return notFound();

  const [activity, tasks] = await Promise.all([
    getContactActivity(params.id),
    getContactTasks(params.id),
  ]);

  return (
    <PageTransition>
      <ContactDetailHeader
        contact={contact}
        owner={contact.owner ?? null}
        account={contact.account ?? null}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Follow Ups</CardTitle></CardHeader>
            <CardContent><TaskMiniList tasks={tasks as any} /></CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Outcome History</CardTitle></CardHeader>
            <CardContent><ActivityTimeline activities={activity} /></CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
