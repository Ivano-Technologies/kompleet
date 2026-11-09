import { COOKIE_CONSENT_STORAGE_KEY } from "../../src/lib/cookie-consent";

/** Empty storage so the cookie banner is visible (used by cookie-consent.spec). */
export const EMPTY_STORAGE_STATE = {
  cookies: [],
  origins: [],
};

/**
 * Money-path specs click controls near the bottom of the viewport. Seed a
 * stored Decline so the cookie banner does not intercept those clicks.
 * The cookie-consent spec opts out of this via EMPTY_STORAGE_STATE.
 */
export function cookieConsentDeniedStorageState(baseURL: string) {
  return {
    cookies: [],
    origins: [
      {
        origin: new URL(baseURL).origin,
        localStorage: [
          { name: COOKIE_CONSENT_STORAGE_KEY, value: "denied" },
        ],
      },
    ],
  };
}
