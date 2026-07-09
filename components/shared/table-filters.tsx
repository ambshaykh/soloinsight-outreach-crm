"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface FilterOption { value: string; label: string; }
export interface FilterDef { key: string; label: string; options: FilterOption[]; }

export function TableFilters({ filters, searchPlaceholder }: { filters: FilterDef[]; searchPlaceholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          defaultValue={searchParams.get("search") ?? ""}
          placeholder={searchPlaceholder ?? "Search…"}
          className="pl-9"
          onKeyDown={(e) => { if (e.key === "Enter") setParam("search", (e.target as HTMLInputElement).value); }}
        />
      </div>
      {filters.map((f) => (
        <Select key={f.key} defaultValue={searchParams.get(f.key) ?? "all"} onValueChange={(v) => setParam(f.key, v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder={f.label} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {f.label}</SelectItem>
            {f.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
