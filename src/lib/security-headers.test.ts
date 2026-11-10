import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  HSTS_VALUE,
  PERMISSIONS_POLICY_VALUE,
  STATIC_SECURITY_HEADERS,
  applySecurityHeaders,
  attachCspRequestHeaders,
  buildContentSecurityPolicy,
  createNonce,
} from "./security-headers.mjs";

function scriptSrc(csp: string): string {
  const match = csp.match(/script-src ([^;]+)/);
  if (!match) {
    throw new Error(`script-src missing from ${csp}`);
  }
  return match[1];
}

describe("buildContentSecurityPolicy", () => {
  it("uses a nonce and strict-dynamic without script unsafe-inline or unsafe-eval", () => {
    const nonce = "testNonce+/=";
    const csp = buildContentSecurityPolicy({ nonce, isDev: false });
    const scripts = scriptSrc(csp);

    expect(scripts).toContain(`'nonce-${nonce}'`);
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("unsafe-inline");
    expect(scripts).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows Next, Convex, Sentry, and consent-gated GA hosts", () => {
    const csp = buildContentSecurityPolicy({ nonce: "abc", isDev: false });

    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://www.google-analytics.com");
    expect(csp).toContain("https://*.convex.cloud");
    expect(csp).toContain("wss://*.convex.cloud");
    expect(csp).toContain("https://*.convex.site");
    expect(csp).toContain("https://*.ingest.sentry.io");
    expect(csp).toContain("https://*.ingest.us.sentry.io");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("api.resend.com");
    expect(csp).not.toContain("supabase.co");
  });

  it("allows unsafe-eval only in development and skips upgrade-insecure-requests", () => {
    const dev = buildContentSecurityPolicy({ nonce: "dev", isDev: true });
    expect(scriptSrc(dev)).toContain("'unsafe-eval'");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });

  it("omits report-uri because no CSP report endpoint exists", () => {
    expect(buildContentSecurityPolicy({ nonce: "n" })).not.toMatch(
      /report-uri|report-to/i,
    );
  });
});

describe("static security headers", () => {
  it("ships HSTS preload, frame deny, COOP, nosniff, referrer, and permissions-policy", () => {
    const byKey = Object.fromEntries(
      STATIC_SECURITY_HEADERS.map((header) => [header.key, header.value]),
    );

    expect(byKey["Strict-Transport-Security"]).toBe(HSTS_VALUE);
    expect(HSTS_VALUE).toContain("preload");
    expect(HSTS_VALUE).toContain("includeSubDomains");
    expect(HSTS_VALUE).toMatch(/max-age=63072000/);
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(byKey["Permissions-Policy"]).toBe(PERMISSIONS_POLICY_VALUE);
    expect(PERMISSIONS_POLICY_VALUE).toContain("camera=()");
    expect(PERMISSIONS_POLICY_VALUE).toContain("geolocation=()");
    expect(PERMISSIONS_POLICY_VALUE).toContain("interest-cohort=()");
  });
});

describe("applySecurityHeaders", () => {
  it("sets enforcing CSP and the static header set on a response", () => {
    const response = NextResponse.next();
    const nonce = createNonce();
    const csp = applySecurityHeaders(response, { nonce, isDev: false });

    expect(response.headers.get("Content-Security-Policy")).toBe(csp);
    expect(response.headers.get("Content-Security-Policy-Report-Only")).toBeNull();
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(response.headers.get("Strict-Transport-Security")).toBe(HSTS_VALUE);
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers.get("Permissions-Policy")).toBe(
      PERMISSIONS_POLICY_VALUE,
    );
    expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });

  it("attaches nonce CSP on the request so Next.js can stamp scripts", () => {
    const headers = new Headers();
    const nonce = "requestNonce";
    const csp = attachCspRequestHeaders(headers, { nonce, isDev: false });

    expect(headers.get("x-nonce")).toBe(nonce);
    expect(headers.get("Content-Security-Policy")).toBe(csp);
    expect(csp).toContain(`'nonce-${nonce}'`);
  });
});

describe("next.config and vercel.json header wiring", () => {
  it("does not set a static CSP in next.config (nonce CSP lives in proxy)", () => {
    const config = readFileSync(
      path.join(process.cwd(), "next.config.mjs"),
      "utf8",
    );
    expect(config).toMatch(/STATIC_SECURITY_HEADERS/);
    expect(config).not.toMatch(/key:\s*["']Content-Security-Policy/);
    expect(config).toMatch(/security-headers\.mjs/);
  });

  it("aligns API headers in vercel.json with HSTS preload and COOP", () => {
    const vercel = JSON.parse(
      readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"),
    ) as {
      headers: { headers: { key: string; value: string }[] }[];
    };
    const apiHeaders = Object.fromEntries(
      vercel.headers[0].headers.map((header) => [header.key, header.value]),
    );
    expect(apiHeaders["Strict-Transport-Security"]).toBe(HSTS_VALUE);
    expect(apiHeaders["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(apiHeaders["X-Frame-Options"]).toBe("DENY");
    expect(apiHeaders["X-Content-Type-Options"]).toBe("nosniff");
    expect(apiHeaders["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });
});
