"use client";

import { createContext, useContext } from "react";
import type { CookieConsentChoice } from "@/lib/cookie-consent";

export type CookieConsentContextValue = {
  choice: CookieConsentChoice | null;
  accept: () => void;
  decline: () => void;
  openSettings: () => void;
};

export const CookieConsentContext =
  createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const value = useContext(CookieConsentContext);
  if (!value) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return value;
}
