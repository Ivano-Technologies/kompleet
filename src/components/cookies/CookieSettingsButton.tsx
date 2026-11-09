"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";

export function CookieSettingsButton({
  className = "hover:text-text-1",
}: {
  className?: string;
}) {
  const { openSettings } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={openSettings}
      className={`inline-flex min-h-11 items-center ${className}`}
    >
      Cookie settings
    </button>
  );
}
