"use client";

import { useEffect } from "react";
import {
  applyConsentModeDefaultDenied,
  loadGoogleAnalytics,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

export function GoogleAnalytics({
  measurementId,
  choice,
}: {
  measurementId?: string;
  choice: CookieConsentChoice | null;
}) {
  useEffect(() => {
    if (!measurementId) {
      return;
    }

    applyConsentModeDefaultDenied();

    if (choice === "granted") {
      loadGoogleAnalytics(measurementId);
    }
  }, [choice, measurementId]);

  return null;
}
