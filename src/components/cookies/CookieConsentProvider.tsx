"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyConsentModeDefaultDenied,
  loadGoogleAnalytics,
  readStoredCookieConsent,
  revokeGoogleAnalytics,
  writeStoredCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import { CookieConsentBanner } from "@/components/cookies/CookieConsentBanner";
import { CookieConsentContext } from "@/components/cookies/CookieConsentContext";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

export { useCookieConsent } from "@/components/cookies/CookieConsentContext";

export function CookieConsentProvider({
  children,
  measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
}: {
  children: ReactNode;
  measurementId?: string;
}) {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    applyConsentModeDefaultDenied();
    setChoice(readStoredCookieConsent());
    setHydrated(true);
  }, []);

  const accept = useCallback(() => {
    writeStoredCookieConsent("granted");
    setChoice("granted");
    setSettingsOpen(false);
    if (measurementId) {
      loadGoogleAnalytics(measurementId);
    }
  }, [measurementId]);

  const decline = useCallback(() => {
    writeStoredCookieConsent("denied");
    setChoice("denied");
    setSettingsOpen(false);
    revokeGoogleAnalytics();
  }, []);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const value = useMemo(
    () => ({ choice, accept, decline, openSettings }),
    [choice, accept, decline, openSettings],
  );

  const showBanner = hydrated && (choice === null || settingsOpen);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <GoogleAnalytics measurementId={measurementId} choice={choice} />
      {showBanner ? <CookieConsentBanner /> : null}
    </CookieConsentContext.Provider>
  );
}
