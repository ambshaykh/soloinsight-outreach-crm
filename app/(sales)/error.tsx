"use client";

import { useEffect } from "react";
import { ServerErrorState } from "@/components/shared/state-patterns";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <ServerErrorState onRetry={reset} requestId={error.digest} />;
}
