import { requirePortalAccess } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePortalAccess("admin");

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F3FF]">
      <AdminSidebar role={profile.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
