/**
 * KOMPLEET-PLATFORM-6 — drop "Failed to fetch" noise from stale tabs on
 * legacy hosts after the 308 cutover to kompleet.techivano.com.
 *
 * Keep this narrow: only exact Failed-to-fetch client errors, and only when
 * the page host is not the canonical production host. Do not use this to
 * widen CORS or change Convex / auth domains.
 */

export const CANONICAL_APP_HOST = "kompleet.techivano.com";

export type SentryExceptionLike = {
  type?: string;
  value?: string;
};

export type SentryEventLike = {
  message?: string;
  exception?: {
    values?: SentryExceptionLike[];
  };
  request?: {
    url?: string;
  };
};

function isFailedToFetchMessage(text: string | undefined): boolean {
  if (!text) return false;
  return /^(typeerror:\s*)?failed to fetch$/i.test(text.trim());
}

export function eventIsFailedToFetch(event: SentryEventLike): boolean {
  const exceptions = event.exception?.values ?? [];
  for (const item of exceptions) {
    if (isFailedToFetchMessage(item.value)) return true;
    if (isFailedToFetchMessage(`${item.type ?? ""}: ${item.value ?? ""}`)) {
      return true;
    }
  }
  return isFailedToFetchMessage(event.message);
}

export function resolveEventHost(
  event: SentryEventLike,
  pageHost?: string,
): string | undefined {
  if (pageHost && pageHost.length > 0) return pageHost;
  const url = event.request?.url;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

export function shouldDropStaleHostFailedFetch(
  event: SentryEventLike,
  pageHost?: string,
): boolean {
  if (!eventIsFailedToFetch(event)) return false;
  const host = resolveEventHost(event, pageHost);
  if (!host) return false;
  return host !== CANONICAL_APP_HOST;
}
