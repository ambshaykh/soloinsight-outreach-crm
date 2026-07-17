import type { UserRole } from "@/lib/types/database";

export type PortalSlug = "sales" | "admin" | "salesforce" | "executive";

export const PORTAL_SLUGS: PortalSlug[] = ["sales", "admin", "salesforce", "executive"];

export type PortalConfig = {
  slug: PortalSlug;
  name: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  description: string;
  /** Where a signed-in, authorized user lands after choosing/entering this portal. */
  home: string;
  gradient: string;
  accent: string;
};

export const PORTALS: Record<PortalSlug, PortalConfig> = {
  sales: {
    slug: "sales",
    name: "Sales",
    eyebrow: "Manual Outreach CRM",
    headline: "Every call. Every email.\nTracked, owned, and followed up.",
    subhead: "Accounts, contacts, outreach queue, and analytics for SDRs and sales ops.",
    description: "Accounts, contacts, outreach queue & analytics.",
    home: "/dashboard",
    gradient: "linear-gradient(135deg, #1a0b2e 0%, #2d1450 18%, #4c1d95 34%, #5b21b6 50%, #6d28d9 64%, #2d1450 80%, #1a0b2e 100%)",
    accent: "from-indigo-400/40 via-violet-400/20 to-transparent",
  },
  admin: {
    slug: "admin",
    name: "Admin Center",
    eyebrow: "Workspace Administration",
    headline: "Every user. Every permission.\nUnder one roof.",
    subhead: "Manage teammates, teams, and exactly what each role can see and do.",
    description: "Users, teams, roles & permissions.",
    home: "/admin",
    gradient: "linear-gradient(135deg, #1a0b2e 0%, #2d1450 18%, #4c1d95 34%, #5b21b6 50%, #6d28d9 64%, #2d1450 80%, #1a0b2e 100%)",
    accent: "from-violet-400/40 via-fuchsia-400/20 to-transparent",
  },
  salesforce: {
    slug: "salesforce",
    name: "Salesforce",
    eyebrow: "Campaign Intelligence",
    headline: "Every campaign. Every send.\nSynced automatically.",
    subhead: "Leads uploaded, emails sent, bounce rates, and unsubscribes across your Salesforce orgs.",
    description: "Synced Salesforce campaigns, leads & bounce/unsubscribe data.",
    home: "/salesforce",
    gradient: "linear-gradient(135deg, #1a0b2e 0%, #2d1450 18%, #4c1d95 34%, #5b21b6 50%, #6d28d9 64%, #2d1450 80%, #1a0b2e 100%)",
    accent: "from-fuchsia-400/40 via-purple-400/20 to-transparent",
  },
  executive: {
    slug: "executive",
    name: "Executive Dashboard",
    eyebrow: "Leadership Overview",
    headline: "Every number that matters.\nOne view.",
    subhead: "A cross-portal rollup built for leadership decisions.",
    description: "Cross-portal metrics for leadership, at a glance.",
    home: "/executive",
    gradient: "linear-gradient(135deg, #1a0b2e 0%, #2d1450 18%, #4c1d95 34%, #5b21b6 50%, #6d28d9 64%, #2d1450 80%, #1a0b2e 100%)",
    accent: "from-purple-400/40 via-violet-400/20 to-transparent",
  },
};

/** Single source of truth for which roles may enter which portal. */
export const PORTAL_ROLES: Record<PortalSlug, UserRole[]> = {
  sales: ["admin", "manager", "sdr", "salesforce_admin"],
  admin: ["admin"],
  salesforce: ["admin", "salesforce_admin", "salesforce_viewer"],
  executive: ["admin", "executive"],
};

export function canAccessPortal(role: UserRole, portal: PortalSlug): boolean {
  return PORTAL_ROLES[portal].includes(role);
}

export function portalsForRole(role: UserRole): PortalSlug[] {
  return PORTAL_SLUGS.filter((p) => canAccessPortal(role, p));
}

/** Maps a request path to the portal it belongs to, for auth/2FA redirects. Null = universal (e.g. /account). */
export function portalForPath(path: string): PortalSlug | null {
  if (path === "/dashboard" || path.startsWith("/dashboard/")) return "sales";
  if (path.startsWith("/accounts")) return "sales";
  if (path.startsWith("/contacts")) return "sales";
  if (path.startsWith("/outreach-queue")) return "sales";
  if (path.startsWith("/follow-ups")) return "sales";
  if (path.startsWith("/activities")) return "sales";
  if (path.startsWith("/analytics")) return "sales";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/salesforce")) return "salesforce";
  if (path.startsWith("/executive")) return "executive";
  return null;
}
