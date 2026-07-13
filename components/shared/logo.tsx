import { cn } from "@/lib/utils";

// Placeholder mark inspired by the Soloinsight brand icon (circular ring with
// two stacked bars). Swap the <svg> below for the real logo asset whenever
// it's available — everything else (sizing, wordmark) stays.
export function Logo({ className, mark = true, wordmark = true }: { className?: string; mark?: boolean; wordmark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {mark && (
        <svg viewBox="0 0 48 48" className="h-7 w-7 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2.5" />
          <rect x="15" y="15" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2.5" />
          <rect x="15" y="26" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )}
      {wordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-base font-semibold tracking-tight">Soloinsight</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-current/60">Outreach CRM</span>
        </div>
      )}
    </div>
  );
}
