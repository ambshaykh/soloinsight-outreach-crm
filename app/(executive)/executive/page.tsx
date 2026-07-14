import { LineChart, Clock } from "lucide-react";

export default function ExecutivePortalHome() {
  return (
    <div className="max-w-lg text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
        <LineChart className="h-6 w-6 text-amber-400" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">Executive Dashboard</h1>
      <p className="mt-2 text-sm text-white/60">
        Login and access control for this portal are live. The drag-and-drop dashboard (Phase 4) is still being built.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
          <Clock className="h-3.5 w-3.5" /> Coming in Phase 4
        </div>
        <ul className="space-y-2 text-sm text-white/70">
          <li>• Drag-and-drop widget layout, saved per user</li>
          <li>• Cross-portal rollup: Sales pipeline + Salesforce campaign metrics</li>
          <li>• Leadership-level summary views</li>
        </ul>
      </div>
    </div>
  );
}
