"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOutOtherSessions } from "@/app/actions/auth";

export function SignOutOthersButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const r = await signOutOtherSessions();
      if (r.error) toast.error(r.error); else toast.success("Every other session has been signed out.");
    });
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={isPending}>
      {isPending ? "Signing out…" : "Sign out other devices"}
    </Button>
  );
}
