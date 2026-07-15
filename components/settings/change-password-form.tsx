"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updatePassword } from "@/app/actions/auth";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords don't match."); return; }
    startTransition(async () => {
      const r = await updatePassword(formData);
      if (r.error) toast.error(r.error); else toast.success("Password updated");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" name="confirm" type="password" minLength={8} required autoComplete="new-password" />
      </div>
      <Button type="submit" disabled={isPending}>{isPending ? "Updating…" : "Update password"}</Button>
    </form>
  );
}
