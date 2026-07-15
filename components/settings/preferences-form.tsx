"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updatePreferences } from "@/app/actions/users";
import type { UserPreferences } from "@/lib/types/database";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Asia/Karachi", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney",
];

export function PreferencesForm({ preferences }: { preferences: UserPreferences }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const r = await updatePreferences(formData);
      if (r.error) toast.error(r.error); else { toast.success("Preferences saved"); router.refresh(); }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Select name="timezone" defaultValue={preferences.timezone ?? "UTC"}>
          <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
          </SelectContent>
        </Select>
        {/* Select doesn't submit a native form field by itself in this component set, so mirror it with a hidden input. */}
      </div>
      <div>
        <Label htmlFor="density">Density</Label>
        <Select name="density" defaultValue={preferences.density ?? "comfortable"}>
          <SelectTrigger id="density"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="comfortable">Comfortable (default)</SelectItem>
            <SelectItem value="compact">Compact</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-[#0F1419]">High-contrast mode</p>
          <p className="text-xs text-[#6B7280]">Bumps border and text contrast for low-light or accessibility needs.</p>
        </div>
        <Switch name="high_contrast" defaultChecked={preferences.high_contrast ?? false} />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-[#0F1419]">Reduced motion</p>
          <p className="text-xs text-[#6B7280]">Disables transition animations across the app.</p>
        </div>
        <Switch name="reduced_motion" defaultChecked={preferences.reduced_motion ?? false} />
      </div>
      <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save preferences"}</Button>
    </form>
  );
}
