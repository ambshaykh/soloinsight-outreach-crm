"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export interface PickedContact {
  id: string;
  first_name: string;
  last_name: string;
  account_id: string | null;
  company_name?: string | null;
}

export function ContactPicker({ onSelect }: { onSelect: (contact: PickedContact) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedContact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const supabase = createClient();
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, account_id, account:accounts(company_name)")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(8);
      setResults(
        (data ?? []).map((c: any) => ({
          id: c.id, first_name: c.first_name, last_name: c.last_name,
          account_id: c.account_id, company_name: c.account?.company_name,
        }))
      );
      setLoading(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts by name or email…"
          className="pl-9"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c); setQuery(""); setResults([]); }}
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-[#0F1419]">{c.first_name} {c.last_name}</span>
              {c.company_name && <span className="text-xs text-[#6B7280]">{c.company_name}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
