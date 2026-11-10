import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY } from "./content-security-policy.mjs";

describe("enforced CSP", () => {
  it("allows GA, Sentry ingest, Convex, Vercel insights, and the /monitoring tunnel via 'self'", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("https://www.googletagmanager.com");
    expect(CONTENT_SECURITY_POLICY).toContain("https://www.google-analytics.com");
    expect(CONTENT_SECURITY_POLICY).toContain("https://*.convex.cloud");
    expect(CONTENT_SECURITY_POLICY).toContain("wss://*.convex.cloud");
    expect(CONTENT_SECURITY_POLICY).toContain("https://*.ingest.sentry.io");
    expect(CONTENT_SECURITY_POLICY).toContain("https://*.ingest.us.sentry.io");
    expect(CONTENT_SECURITY_POLICY).toContain("https://vitals.vercel-insights.com");
    expect(CONTENT_SECURITY_POLICY).toContain("https://va.vercel-scripts.com");
    expect(CONTENT_SECURITY_POLICY).toContain("connect-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("blob:");
  });

  it("drops unused browser connect-src hosts", () => {
    expect(CONTENT_SECURITY_POLICY).not.toContain("supabase.co");
    expect(CONTENT_SECURITY_POLICY).not.toContain("api.resend.com");
  });

  it("does not upgrade-insecure-requests (HTTP local/preview still loads)", () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/upgrade-insecure-requests/i);
  });

  it("omits report-uri because no CSP report endpoint exists", () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/report-uri|report-to/i);
  });
});
