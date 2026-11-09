/**
 * Content-Security-Policy-Report-Only for Kompleet.
 *
 * Report-only first: a strict enforcing CSP would break GA (after consent),
 * the Sentry tunnel at /monitoring, Convex websocket traffic, and Next.js
 * inline hydration scripts. Tighten to enforcing after Chief prod PASS.
 *
 * Allowed third parties (audit IVA-289):
 * - Google Analytics / gtag (after cookie consent)
 * - Sentry via same-origin `/monitoring` plus ingest hosts
 * - Convex (HTTP + WebSocket)
 * - Resend is server-side only (api.resend.com) — not needed in script-src
 */

export const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
  "default-src 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ].join(" "),
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
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://*.ingest.sentry.io",
    "https://*.ingest.us.sentry.io",
    "https://*.ingest.de.sentry.io",
    "https://*.sentry.io",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://region1.google-analytics.com",
    "https://api.resend.com",
  ].join(" "),
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");
