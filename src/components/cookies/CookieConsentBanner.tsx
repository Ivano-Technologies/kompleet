"use client";

import Link from "next/link";
import { COMPANY_LEGAL } from "@/lib/legal";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";

export function CookieConsentBanner() {
  const { accept, decline } = useCookieConsent();

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-copy"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-4 shadow-1 sm:p-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p
            id="cookie-consent-title"
            className="text-sm font-semibold text-text-1"
          >
            Cookie notice
          </p>
          <p id="cookie-consent-copy" className="mt-1 text-sm text-text-2">
            We use essential cookies to keep you signed in. Google Analytics
            loads and sets cookies only if you accept. You can change this
            later under Cookie settings. See our{" "}
            <Link href="/cookies" className="text-primary underline-offset-2 hover:underline">
              cookie notice
            </Link>{" "}
            and{" "}
            <a
              href={COMPANY_LEGAL.privacy}
              className="text-primary underline-offset-2 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={decline}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-1 hover:bg-surface-2"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-charcoal hover:bg-accent-hover"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
