"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-lg border border-slate-200 shadow-lg text-sm",
        },
      }}
    />
  );
}
