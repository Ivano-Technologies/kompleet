/**
 * Convex Auth POSTs to `/api/auth` via `fetch` with no hook for extra headers.
 * When Turnstile is on, the widget stores the latest token here and this
 * patch attaches it as `x-turnstile-token`.
 */

let pendingToken: string | null = null;
let patched = false;
let originalFetch: typeof fetch | null = null;

export function setPendingTurnstileToken(token: string | null): void {
  pendingToken = token;
}

export function getPendingTurnstileToken(): string | null {
  return pendingToken;
}

export function installTurnstileFetchPatch(): () => void {
  if (typeof window === "undefined" || patched) {
    return () => {};
  }
  patched = true;
  originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (
      init?.method ??
      (typeof Request !== "undefined" && input instanceof Request
        ? input.method
        : "GET")
    ).toUpperCase();
    const isAuthPost = url.includes("/api/auth") && method === "POST";
    if (isAuthPost && pendingToken && originalFetch) {
      const headers = new Headers(init?.headers);
      headers.set("x-turnstile-token", pendingToken);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch!(input, init);
  };
  return () => {
    if (originalFetch) {
      window.fetch = originalFetch;
    }
    patched = false;
    originalFetch = null;
  };
}
