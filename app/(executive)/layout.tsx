import { requirePortalAccess } from "@/lib/auth/session";
import { PortalPlaceholderShell } from "@/components/portals/portal-placeholder-shell";

export default async function ExecutivePortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePortalAccess("executive");
  return <PortalPlaceholderShell profile={profile}>{children}</PortalPlaceholderShell>;
}
