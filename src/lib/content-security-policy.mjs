/**
 * Enforced Content-Security-Policy for Kompleet.
 *
 * Report-only was the first cut (IVA-289). After dropping unused
 * connect-src hosts (*.supabase.co, api.resend.com — Resend is server-side
 * only) the remaining origins are the ones the browser actually talks to:
 * Convex HTTP + WebSocket, Sentry ingest (+ same-origin /monitoring tunnel),
 * Google Analytics after cookie consent, Vercel insights if the host injects
 * them, and blob/data for uploads and workers.
 *
 * Tighten further (nonces, drop unsafe-eval) after a Chief prod PASS.
 *
 * No report-uri / report-to: there is no existing CSP report collector
 * (no /api/csp-report or equivalent). Pointing report-uri at a missing
 * route would 404 every browser report.
 */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://va.vercel-scripts.com",
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
    "blob:",
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
    "https://vitals.vercel-insights.com",
    "https://*.vercel-insights.com",
    "https://va.vercel-scripts.com",
  ].join(" "),
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");
