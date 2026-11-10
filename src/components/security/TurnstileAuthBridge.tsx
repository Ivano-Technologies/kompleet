"use client";

import { useEffect, type ReactNode } from "react";
import { installTurnstileFetchPatch } from "@/lib/turnstile-fetch";
import { turnstileEnabledOnClient } from "@/components/security/TurnstileField";

/** Patches window.fetch so Convex Auth POSTs carry the Turnstile token. */
export function TurnstileAuthBridge({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!turnstileEnabledOnClient()) {
      return;
    }
    return installTurnstileFetchPatch();
  }, []);

  return children;
}
