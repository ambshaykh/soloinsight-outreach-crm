import { Cloud, Clock } from "lucide-react";

export default function SalesforcePortalHome() {
  return (
    <div className="max-w-lg text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
        <Cloud className="h-6 w-6 text-emerald-400" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">Salesforce portal</h1>
      <p className="mt-2 text-sm text-white/60">
        Login and access control for this portal are live. The live data sync (Phase 3) is still being built.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
          <Clock className="h-3.5 w-3.5" /> Coming in Phase 3
        </div>
        <ul className="space-y-2 text-sm text-white/70">
          <li>• Live OAuth sync across all 4 Salesforce orgs (1 Enterprise, 3 Pro)</li>
          <li>• Total leads uploaded per campaign</li>
          <li>• Emails sent and campaigns run</li>
          <li>• Bounce rate — per campaign and total</li>
          <li>• Unsubscribes</li>
        </ul>
        <p className="mt-4 text-xs text-white/40">
          Data will be sourced from Salesforce's own Campaign &amp; Campaign Member objects — no external ESP.
        </p>
      </div>
    </div>
  );
}
