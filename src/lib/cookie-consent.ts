export const COOKIE_CONSENT_STORAGE_KEY = "kompleet.cookie-consent.v1";

/** Document inset while the cookie banner is open. Written by ResizeObserver. */
export const COOKIE_BANNER_HEIGHT_VAR = "--cookie-banner-height";

export function applyCookieBannerHeight(heightPx: number): void {
  document.documentElement.style.setProperty(
    COOKIE_BANNER_HEIGHT_VAR,
    `${Math.max(0, Math.ceil(heightPx))}px`,
  );
}

export function clearCookieBannerHeight(): void {
  document.documentElement.style.setProperty(COOKIE_BANNER_HEIGHT_VAR, "0px");
}

export type CookieConsentChoice = "granted" | "denied";

export const CONSENT_MODE_DEFAULT_DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  personalization_storage: "denied",
  security_storage: "granted",
} as const;

export const CONSENT_MODE_ANALYTICS_GRANTED = {
  ...CONSENT_MODE_DEFAULT_DENIED,
  analytics_storage: "granted",
} as const;

export const GTAG_SCRIPT_SRC = "https://www.googletagmanager.com/gtag/js";

export function parseCookieConsentChoice(
  value: string | null,
): CookieConsentChoice | null {
  if (value === "granted" || value === "denied") {
    return value;
  }
  return null;
}

export function readStoredCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return parseCookieConsentChoice(
      window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

export function writeStoredCookieConsent(choice: CookieConsentChoice): void {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function applyConsentModeDefaultDenied(): void {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  window.gtag("consent", "default", CONSENT_MODE_DEFAULT_DENIED);
}

export function gtagScriptUrl(measurementId: string): string {
  return `${GTAG_SCRIPT_SRC}?id=${encodeURIComponent(measurementId)}`;
}

export function hasGtagScript(measurementId: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  const src = gtagScriptUrl(measurementId);
  return Boolean(document.querySelector(`script[src="${src}"]`));
}

export function loadGoogleAnalytics(measurementId: string): void {
  applyConsentModeDefaultDenied();
  window.gtag?.("consent", "update", CONSENT_MODE_ANALYTICS_GRANTED);
  window.gtag?.("js", new Date());
  window.gtag?.("config", measurementId, { anonymize_ip: true });

  if (hasGtagScript(measurementId)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = gtagScriptUrl(measurementId);
  script.dataset.kompleetGa = "1";
  // Created from the nonce'd Next.js bundle, so CSP3 `'strict-dynamic'`
  // allows it. Host allowlists in script-src cover CSP2 browsers.
  document.head.appendChild(script);
}

export function revokeGoogleAnalytics(): void {
  applyConsentModeDefaultDenied();
  window.gtag?.("consent", "update", CONSENT_MODE_DEFAULT_DENIED);
}
