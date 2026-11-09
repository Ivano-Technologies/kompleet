import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY_REPORT_ONLY } from "./content-security-policy.mjs";

describe("CSP report-only policy", () => {
  it("allows GA, Sentry ingest, Convex, and the /monitoring tunnel via 'self'", () => {
    expect(CONTENT_SECURITY_POLICY_REPORT_ONLY).toContain(
      "https://www.googletagmanager.com",
    );
    expect(CONTENT_SECURITY_POLICY_REPORT_ONLY).toContain(
      "https://www.google-analytics.com",
    );
    expect(CONTENT_SECURITY_POLICY_REPORT_ONLY).toContain(
      "https://*.convex.cloud",
    );
    expect(CONTENT_SECURITY_POLICY_REPORT_ONLY).toContain("wss://*.convex.cloud");
    expect(CONTENT_SECURITY_POLICY_REPORT_ONLY).toContain(
      "https://*.ingest.sentry.io",
    );
    expect(CONTENT_SECURITY_POLICY_REPORT_ONLY).toContain(
      "https://*.ingest.us.sentry.io",
    );
    expect(CONTENT_SECURITY_POLICY_REPORT_ONLY).toContain("connect-src 'self'");
  });

  it("does not enforce the policy (report-only first)", () => {
    expect(CONTENT_SECURITY_POLICY_REPORT_ONLY).not.toMatch(
      /upgrade-insecure-requests/i,
    );
  });
});
