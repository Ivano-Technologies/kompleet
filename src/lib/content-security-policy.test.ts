import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./content-security-policy.mjs";

describe("CSP enforcing policy (re-export)", () => {
  it("allows GA, Sentry ingest, Convex, and the /monitoring tunnel via 'self'", () => {
    const csp = buildContentSecurityPolicy({ nonce: "compat", isDev: false });
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://www.google-analytics.com");
    expect(csp).toContain("https://*.convex.cloud");
    expect(csp).toContain("wss://*.convex.cloud");
    expect(csp).toContain("https://*.ingest.sentry.io");
    expect(csp).toContain("https://*.ingest.us.sentry.io");
    expect(csp).toContain("connect-src 'self'");
  });

  it("omits report-uri because no CSP report endpoint exists", () => {
    expect(buildContentSecurityPolicy({ nonce: "compat" })).not.toMatch(
      /report-uri|report-to/i,
    );
  });
});
