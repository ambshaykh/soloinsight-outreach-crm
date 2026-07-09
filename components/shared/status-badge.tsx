import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_COLORS,
  CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS,
} from "@/lib/constants";
import type { AccountStatus, ContactStatus } from "@/lib/types/database";

export function AccountStatusBadge({ status, className }: { status: AccountStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", ACCOUNT_STATUS_COLORS[status], className)}>
      {ACCOUNT_STATUS_LABELS[status]}
    </span>
  );
}

export function ContactStatusBadge({ status, className }: { status: ContactStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", CONTACT_STATUS_COLORS[status], className)}>
      {CONTACT_STATUS_LABELS[status]}
    </span>
  );
}
