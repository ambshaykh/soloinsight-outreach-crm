"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { discoverSalesforceEmailSchema } from "@/app/actions/salesforce";

type OrgOption = { id: string; label: string };
type SchemaObject = {
  objectName: string;
  label: string;
  custom: boolean;
  fields: { name: string; label: string; type: string }[];
};

export function SchemaDiscoveryPanel({ orgs }: { orgs: OrgOption[] }) {
  const [selectedOrgId, setSelectedOrgId] = useState(orgs[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<SchemaObject[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function handleDiscover() {
    if (!selectedOrgId) return;
    startTransition(async () => {
      const res = await discoverSalesforceEmailSchema(selectedOrgId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setResults(res.result ?? []);
      if (!res.result || res.result.length === 0) {
        toast("No obvious email-tracking objects found — see note below.");
      } else {
        toast.success(`Found ${res.result.length} candidate object${res.result.length === 1 ? "" : "s"}.`);
      }
    });
  }

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  if (orgs.length === 0) return null;

  return (
    <div className="mt-4 border-t border-amber-200 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {orgs.length > 1 && (
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="h-9 rounded-lg border border-amber-200 bg-white px-2 text-xs"
          >
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        )}
        <Button size="sm" variant="secondary" disabled={isPending} onClick={handleDiscover}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Discover email-tracking schema{orgs.length === 1 ? ` for ${orgs[0].label}` : ""}
        </Button>
      </div>

      {results !== null && (
        <div className="mt-4 space-y-2">
          {results.length === 0 ? (
            <p className="text-xs text-amber-800">
              No ListEmail, EmailMessage, or obviously-named custom objects were found (or this connected user
              can't see them). That likely means campaign email isn't being sent through a Salesforce-native
              mechanism we can query yet — worth checking with whoever actually sends the campaigns.
            </p>
          ) : (
            results.map((obj) => (
              <div key={obj.objectName} className="rounded-lg border border-amber-200 bg-white/60">
                <button
                  type="button"
                  onClick={() => toggle(obj.objectName)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-amber-900"
                >
                  <span>
                    {obj.label} <span className="text-amber-600">({obj.objectName})</span>
                    {obj.custom && <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px]">custom</span>}
                  </span>
                  {expanded.has(obj.objectName) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
                {expanded.has(obj.objectName) && (
                  <div className="border-t border-amber-100 px-3 py-2">
                    <ul className="space-y-1 text-[11px] text-amber-800">
                      {obj.fields.map((f) => (
                        <li key={f.name} className="flex justify-between gap-3">
                          <span className="font-mono">{f.name}</span>
                          <span className="text-amber-600">{f.label} · {f.type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
          <p className="text-[11px] text-amber-700">
            Screenshot or copy this and send it back — once we know which object actually holds send/bounce/unsubscribe
            data, the real sync logic can be written against it.
          </p>
        </div>
      )}
    </div>
  );
}
