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
const notice = readFileSync(
  resolve(process.cwd(), "src/components/legal/CompanyLegalNotice.tsx"),
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

  it("includes restriction, automated-decision, free-of-charge, and identity checks", () => {
    expect(privacy).toMatch(/Restriction:/);
    expect(privacy).toMatch(/decision based solely on automated processing/);
    expect(privacy).toMatch(/Requests\s+are free of charge/);
    expect(privacy).toMatch(/proof of identity/);
    expect(privacy).toMatch(/Standard Notice to Address Grievance \(SNAG\)/);
  });

  it("does not treat using the app as deemed consent", () => {
    expect(privacy).not.toMatch(/using KOMPLEET, you agree/i);
    expect(privacy).not.toMatch(/By using KOMPLEET, you agree/i);
  });

  it("discloses international transfers, retention, breach notification, and Sentry replay", () => {
    expect(privacy).toMatch(/Convex/);
    expect(privacy).toMatch(/iad1/);
    expect(privacy).toMatch(/Resend/);
    expect(privacy).toMatch(/Sentry/);
    expect(privacy).toMatch(/session replay/i);
    expect(privacy).toMatch(/held in memory/);
    expect(privacy).toMatch(/uploaded only if an error\s+occurs/);
    expect(privacy).toMatch(/6 years/);
    expect(privacy).toMatch(/72 hours/);
    expect(privacy).toMatch(/We do not claim Nigerian data residency/);
    expect(privacy).toMatch(/ss\. 41 to 43/);
    expect(privacy).toMatch(/IP address \(approximate location\)/);
    expect(privacy).toMatch(/audit logs/i);
    expect(privacy).toMatch(/Sentry plan default/);
    expect(privacy).toMatch(/24 months/);
    expect(privacy).toMatch(/Convex backups/);
    expect(privacy).toMatch(/rate-limit/);
    expect(privacy).toMatch(/Contact form and support emails/);
    expect(privacy).toMatch(/Weekly deadline reminder emails/);
  });

  it("lists Zoho and states AI providers are not currently used", () => {
    expect(privacy).toMatch(/Zoho Corporation/);
    expect(privacy).toMatch(/do not currently send your data to AI providers/i);
  });

  it("lists only cookies and storage the product actually sets", () => {
    expect(cookies).toContain("__Host-__convexAuthJWT");
    expect(cookies).toContain("__Host-__convexAuthRefreshToken");
    expect(cookies).toContain("__convexAuthServerStateFetchTime_*");
    expect(cookies).toContain("sentryReplaySession");
    expect(cookies).toContain("kompleet-theme");
    expect(cookies).toContain("kompleet_selected_year");
    expect(cookies).toContain("COOKIE_CONSENT_STORAGE_KEY");
    expect(COOKIE_CONSENT_STORAGE_KEY).toBe("kompleet.cookie-consent.v1");
    expect(cookies).toMatch(/local storage/i);
    expect(cookies).toMatch(/session storage/i);
    expect(cookies).toMatch(/No consent needed/);
    expect(cookies).not.toMatch(/CSRF tokens/i);
    expect(cookies).not.toMatch(/Language and locale/);
    expect(cookies).not.toMatch(/Dashboard layout/);
    expect(cookies).not.toMatch(/Vercel:<\/strong> Performance/);
    expect(cookies).not.toMatch(/Sentry:<\/strong> Error tracking/);
    expect(cookies).not.toMatch(/aggregated and anonymized/i);
  });

  it("keeps the cookie inventory readable on a 390px viewport", () => {
    expect(cookies).toMatch(/md:hidden/);
    expect(cookies).toMatch(/hidden overflow-x-auto md:block/);
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

  it("shows Last updated 10 Nov 2026 on privacy, cookies, and terms", () => {
    expect(privacy).toMatch(/Last updated 10 Nov 2026/);
    expect(cookies).toMatch(/Last updated 10 Nov 2026/);
    expect(terms).toMatch(/Last updated 10 Nov 2026/);
    expect(privacy).not.toMatch(/Last updated: February/);
    expect(cookies).not.toMatch(/Last updated: February/);
  });

  it("does not let the company page prevail over Kompleet product copy", () => {
    expect(notice).toMatch(/governs personal data processed inside Kompleet/);
    expect(notice).toMatch(
      /website, contact and company\s+dealings/,
    );
    expect(notice).not.toMatch(/source of truth/i);
    expect(notice).not.toMatch(/company page is the source/i);
    expect(notice).not.toMatch(/purchases/i);
    expect(notice).toMatch(/dark:bg-dark-surface-2/);
  });

  it("keeps payment processors and subscriptions conditional, and drops undisclosed analytics", () => {
    expect(terms).toMatch(/if and when paid plans are offered/i);
    expect(terms).not.toMatch(/<li>Payment processors<\/li>/);
    expect(terms).not.toMatch(/your purchase/i);
    expect(terms).not.toMatch(/aggregated, anonymized data for analytics/i);
    expect(terms).not.toMatch(/₦/);
    expect(privacy).not.toMatch(/₦/);
    expect(cookies).not.toMatch(/₦/);
  });
});
