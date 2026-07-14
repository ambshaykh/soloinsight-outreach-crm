import { requirePortalAccess } from "@/lib/auth/session";
import { PortalPlaceholderShell } from "@/components/portals/portal-placeholder-shell";

export default async function SalesforcePortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePortalAccess("salesforce");
  return <PortalPlaceholderShell profile={profile}>{children}</PortalPlaceholderShell>;
}
