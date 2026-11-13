import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  COMPANY_LEGAL,
  COOKIE_POLICY_SOURCE_OF_TRUTH,
  DATA_PROTECTION_EMAIL,
  GENERAL_CONTACT_EMAIL,
  OPERATOR_ADDRESS,
  OPERATOR_DPO,
  OPERATOR_LEGAL_NAME,
  OPERATOR_RC,
  OPERATOR_WEBSITE_HREF,
  companyLegalUrl,
} from "@/lib/legal";
import { redirectCompanyRefunds } from "@/lib/refunds-redirect";

describe("company legal URLs", () => {
  it("points Terms, Privacy and Refunds at ivanotechnologies.com", () => {
    expect(COMPANY_LEGAL.terms).toBe("https://www.ivanotechnologies.com/terms");
    expect(COMPANY_LEGAL.privacy).toBe(
      "https://www.ivanotechnologies.com/privacy",
    );
    expect(COMPANY_LEGAL.refunds).toBe(
      "https://www.ivanotechnologies.com/refunds",
    );
    expect(companyLegalUrl("terms")).toBe(COMPANY_LEGAL.terms);
    expect(companyLegalUrl("privacy")).toBe(COMPANY_LEGAL.privacy);
    expect(companyLegalUrl("refunds")).toBe(COMPANY_LEGAL.refunds);
  });

  it("points Kompleet /terms at the company page and keeps /privacy as its own", () => {
    const terms = readFileSync(
      resolve(process.cwd(), "src/app/(public)/terms/page.tsx"),
      "utf8",
    );
    const privacy = readFileSync(
      resolve(process.cwd(), "src/app/(public)/privacy/page.tsx"),
      "utf8",
    );
    expect(terms).toMatch(/CompanyLegalNotice page="terms"/);
    // IVA-224: the Kompleet Privacy Policy is a full replacement that says
    // it is the current policy, so it no longer defers to the company page.
    expect(privacy).not.toMatch(/CompanyLegalNotice/);
    expect(privacy).toMatch(
      /This page is\s+the current Privacy Policy for Kompleet\./,
    );
  });

  it("pins the registered operator as Ivano Technologies Ltd RC 9326735 in Abuja", () => {
    expect(OPERATOR_LEGAL_NAME).toBe("Ivano Technologies Ltd");
    expect(OPERATOR_RC).toBe("RC 9326735");
    expect(OPERATOR_RC).not.toBe("RC 8736090");
    expect(OPERATOR_ADDRESS).toBe(
      "Shop B18, Saham Plaza, No. 10 Alexandria Crescent, Wuse 2, Abuja, FCT, Nigeria",
    );
    expect(OPERATOR_DPO).toBe("David Inalegwu");
    expect(OPERATOR_WEBSITE_HREF).toBe("https://www.ivanotechnologies.com");
    expect(DATA_PROTECTION_EMAIL).toBe("support@ivanotechnologies.com");
    expect(GENERAL_CONTACT_EMAIL).toBe("hi@ivanotechnologies.com");
    expect(COOKIE_POLICY_SOURCE_OF_TRUTH).toMatch(/source of truth/);
  });

  it("308s /refunds and /refunds/ to the company policy in one hop", () => {
    const proxy = readFileSync(resolve(process.cwd(), "src/proxy.ts"), "utf8");
    const body = proxy.slice(proxy.indexOf("export default async function proxy"));
    expect(body.indexOf("redirectCompanyRefunds")).toBeGreaterThan(-1);
    expect(body.indexOf("redirectCompanyRefunds")).toBeLessThan(
      body.indexOf("isThemeShotsBlocked"),
    );

    for (const path of ["/refunds", "/refunds/"] as const) {
      const request = new NextRequest(`https://kompleet.test${path}`);
      const response = redirectCompanyRefunds(request);
      expect(response, path).not.toBeNull();
      expect(response!.status, path).toBe(308);
      expect(response!.headers.get("location"), path).toBe(COMPANY_LEGAL.refunds);
      expect(response!.headers.get("location"), path).not.toMatch(
        /https:\/\/kompleet\.test\/refunds\/?$/,
      );
    }
  });

  it("307s /security to Kompleet /privacy", () => {
    const config = readFileSync(
      resolve(process.cwd(), "next.config.mjs"),
      "utf8",
    );
    expect(config).toMatch(
      /source: "\/security",\s*destination: "\/privacy",\s*permanent: false,/,
    );
    expect(config).not.toMatch(
      /source: "\/security",\s*destination: "\/privacy",\s*permanent: true,/,
    );
  });

  it("replaces Terms §9.2 non-refundable copy with the 14-day company policy", () => {
    const terms = readFileSync(
      resolve(process.cwd(), "src/app/(public)/terms/page.tsx"),
      "utf8",
    );
    expect(terms).not.toMatch(/non-refundable/i);
    expect(terms).toMatch(/14-day refund window/);
    expect(terms).toMatch(/COMPANY_LEGAL\.refunds/);
    expect(terms).toMatch(/one-off founding payment/);
    expect(terms).toMatch(/price is shown at checkout/);
    expect(terms).toMatch(/>\s*Refund Policy\s*</);
    expect(terms).not.toMatch(/COMPANY_LEGAL\.refunds\.replace/);
    expect(terms).not.toMatch(/9\.1 Free and Paid/);
  });
});
