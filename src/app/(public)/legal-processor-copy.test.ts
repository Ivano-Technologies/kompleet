import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookie-consent";
import {
  COMPANY_ADDRESS,
  COMPANY_NAME,
  COMPANY_RC,
  DPO_NAME,
  DSR_EMAIL,
  DSR_RESPONSE_DAYS,
} from "@/lib/legal";

const privacy = readFileSync(
  resolve(process.cwd(), "src/app/(public)/privacy/page.tsx"),
  "utf8",
);
const cookies = readFileSync(
  resolve(process.cwd(), "src/app/(public)/cookies/page.tsx"),
  "utf8",
);
const terms = readFileSync(
  resolve(process.cwd(), "src/app/(public)/terms/page.tsx"),
  "utf8",
);

describe("Kompleet product legal copy (M2–M4)", () => {
  it("does not claim Supabase storage, auth, or cookies", () => {
    expect(privacy).not.toMatch(/Supabase/i);
    expect(cookies).not.toMatch(/Supabase/i);
    expect(terms).not.toMatch(/Supabase/i);
  });

  it("does not claim Google sign-in or third-party OCR", () => {
    expect(privacy).not.toMatch(/Google OAuth/i);
    expect(terms).not.toMatch(/Google OAuth/i);
    expect(privacy).toMatch(/email and\s+password only/i);
    expect(terms).toMatch(/email and password only/i);
    expect(privacy).not.toMatch(
      /third-party OCR and document processing services/,
    );
    expect(privacy).toMatch(/Tesseract\.js/);
    expect(privacy).toMatch(/third-party OCR vendor/);
  });

  it("names the DPO, NDPA lawful bases, NDPC complaint right, and DSR path", () => {
    expect(privacy).toContain("DPO_NAME");
    expect(privacy).toMatch(/Lawful Bases \(Nigeria Data Protection Act 2023\)/);
    expect(privacy).toMatch(/Performance of a contract/);
    expect(privacy).toMatch(/Legal obligation/);
    expect(privacy).toMatch(/Legitimate interests/);
    expect(privacy).toMatch(/Nigeria Data Protection Commission \(NDPC\)/);
    expect(privacy).toMatch(/ndpc\.gov\.ng/);
    expect(privacy).toContain("DSR_EMAIL");
    expect(privacy).toMatch(
      new RegExp(`respond within \\{DSR_RESPONSE_DAYS\\} days`),
    );
    expect(privacy).not.toMatch(/hi@ivanotechnologies\.com/);
    expect(DPO_NAME).toBe("David Inalegwu");
    expect(DSR_EMAIL).toBe("support@ivanotechnologies.com");
    expect(DSR_RESPONSE_DAYS).toBe(30);
  });

  it("discloses international transfers, retention, breach notification, and Sentry replay", () => {
    expect(privacy).toMatch(/Convex/);
    expect(privacy).toMatch(/iad1/);
    expect(privacy).toMatch(/Resend/);
    expect(privacy).toMatch(/Sentry/);
    expect(privacy).toMatch(/session replay/i);
    expect(privacy).toMatch(/6 years/);
    expect(privacy).toMatch(/72 hours/);
    expect(privacy).toMatch(/We do not claim Nigerian data residency/);
  });

  it("lists only cookies and storage the product actually sets", () => {
    expect(cookies).toContain("__Host-__convexAuthJWT");
    expect(cookies).toContain("__Host-__convexAuthRefreshToken");
    expect(cookies).toContain("kompleet-theme");
    expect(cookies).toContain("{COOKIE_CONSENT_STORAGE_KEY}");
    expect(COOKIE_CONSENT_STORAGE_KEY).toBe("kompleet.cookie-consent.v1");
    expect(cookies).toMatch(/local storage/i);
    expect(cookies).not.toMatch(/CSRF tokens/i);
    expect(cookies).not.toMatch(/Language and locale/);
    expect(cookies).not.toMatch(/Dashboard layout/);
    expect(cookies).not.toMatch(/Vercel:<\/strong> Performance/);
    expect(cookies).not.toMatch(/Sentry:<\/strong> Error tracking/);
    expect(cookies).not.toMatch(/aggregated and anonymized/i);
  });

  it("identifies the company on privacy and terms", () => {
    expect(privacy).toContain("COMPANY_NAME");
    expect(privacy).toContain("COMPANY_RC");
    expect(privacy).toContain("COMPANY_ADDRESS");
    expect(terms).toContain("COMPANY_RC");
    expect(terms).toContain("COMPANY_ADDRESS");
    expect(COMPANY_NAME).toBe("Ivano Technologies Ltd");
    expect(COMPANY_RC).toBe("RC 9326735");
    expect(COMPANY_ADDRESS).toMatch(/Saham Plaza/);
  });

  it("sets Last updated to 10 November 2026 and keeps original Effective dates", () => {
    expect(privacy).toMatch(
      /Last updated: 10 November 2026\. Effective date: February 25, 2026\./,
    );
    expect(privacy).not.toMatch(/Last updated: February/);
    expect(cookies).toMatch(/Last updated: 10 November 2026/);
    expect(cookies).not.toMatch(/Last updated: February/);
    expect(cookies).not.toMatch(/Effective date:/);
    expect(terms).toMatch(
      /Last updated: 10 November 2026\. Effective date: February 25, 2026\./,
    );
  });
});
