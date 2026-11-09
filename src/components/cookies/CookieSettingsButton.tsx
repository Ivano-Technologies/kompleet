"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";

export function CookieSettingsButton({
  className = "hover:text-text-1",
}: {
  className?: string;
}) {
  const { openSettings } = useCookieConsent();

  return (
    <button type="button" onClick={openSettings} className={className}>
      Cookie settings
    </button>
  );
}
