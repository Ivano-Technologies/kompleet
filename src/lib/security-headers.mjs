/**
 * Browser security headers for Kompleet (Next.js 16 proxy + next.config).
 *
 * CSP is nonce + strict-dynamic. Next.js reads the request
 * Content-Security-Policy, extracts `'nonce-…'`, and stamps it on framework
 * scripts. Consent-gated GA is injected by those nonce'd bundles, so it is
 * allowed under strict-dynamic (CSP3). Host allowlists remain as a CSP2
 * fallback and are ignored by strict-dynamic browsers.
 *
 * Do not set a second CSP in next.config: multiple CSP headers AND. A static
 * policy without the per-request nonce would block Next inline runtime
 * scripts. Static headers (HSTS, COOP, …) stay in next.config so `_next`
 * assets that skip the proxy matcher still get them.
 */

/** Two years — Chrome preload list minimum is one year. */
export const HSTS_VALUE = "max-age=63072000; includeSubDomains; preload";

export const PERMISSIONS_POLICY_VALUE = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "bluetooth=()",
  "midi=()",
  "interest-cohort=()",
  "accelerometer=()",
  "gyroscope=()",
  "magnetometer=()",
  "display-capture=()",
].join(", ");

/** Headers that do not need a per-request nonce. Safe in next.config. */
export const STATIC_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY_VALUE },
  { key: "Strict-Transport-Security", value: HSTS_VALUE },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

export function createNonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

/**
 * @param {{ nonce?: string, isDev?: boolean }} [options]
 */
export function buildContentSecurityPolicy(options = {}) {
  const nonce = options.nonce;
  const isDev = Boolean(options.isDev);
  const scriptSrc = [
    "script-src",
    "'self'",
    nonce ? `'nonce-${nonce}'` : null,
    "'strict-dynamic'",
    isDev ? "'unsafe-eval'" : null,
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    [
      "img-src",
      "'self'",
      "data:",
      "blob:",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://*.convex.cloud",
      "https://lh3.googleusercontent.com",
      "https://images.unsplash.com",
      "https://files.manuscdn.com",
      "https://private-us-east-1.manuscdn.com",
    ].join(" "),
    "font-src 'self' data:",
    [
      "connect-src",
      "'self'",
      "https://*.convex.cloud",
      "wss://*.convex.cloud",
      "https://*.convex.site",
      "wss://*.convex.site",
      "https://*.ingest.sentry.io",
      "https://*.ingest.us.sentry.io",
      "https://*.ingest.de.sentry.io",
      "https://*.sentry.io",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://region1.google-analytics.com",
    ].join(" "),
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

/**
 * Clone request headers and attach the nonce CSP Next.js reads during SSR.
 *
 * @param {Headers} headers
 * @param {{ nonce: string, isDev?: boolean }} options
 */
export function attachCspRequestHeaders(headers, options) {
  const csp = buildContentSecurityPolicy(options);
  headers.set("x-nonce", options.nonce);
  headers.set("Content-Security-Policy", csp);
  return csp;
}

/**
 * @param {{ headers: { set: (k: string, v: string) => void, delete?: (k: string) => void } }} response
 * @param {{ nonce?: string, isDev?: boolean }} [options]
 */
export function applySecurityHeaders(response, options = {}) {
  const csp = buildContentSecurityPolicy(options);
  for (const { key, value } of STATIC_SECURITY_HEADERS) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", csp);
  if (typeof response.headers.delete === "function") {
    response.headers.delete("Content-Security-Policy-Report-Only");
  }
  return csp;
}
