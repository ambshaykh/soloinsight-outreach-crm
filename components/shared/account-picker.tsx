"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export interface PickedAccount { id: string; company_name: string; }

export function AccountPicker({ onSelect, initialLabel }: { onSelect: (a: PickedAccount) => void; initialLabel?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const supabase = createClient();
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from("accounts").select("id, company_name").ilike("company_name", `%${query}%`).limit(8);
      setResults(data ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={initialLabel ?? "Search accounts…"} className="pl-9" />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { onSelect(a); setQuery(""); setResults([]); }}
              className="flex w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              {a.company_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
