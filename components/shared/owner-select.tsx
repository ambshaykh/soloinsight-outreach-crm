"use client";

import { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

export function OwnerSelect({ value, onChange, name }: { value?: string; onChange?: (v: string) => void; name?: string }) {
  const [owners, setOwners] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    createClient().from("profiles").select("id, full_name").eq("is_active", true).order("full_name").then(({ data }) => {
      setOwners(data ?? []);
    });
  }, []);

  return (
    <Select value={value} onValueChange={onChange} name={name}>
      <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
      <SelectContent>
        {owners.map((o) => (
          <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
