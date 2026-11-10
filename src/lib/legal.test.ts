import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMPANY_LEGAL,
  COOKIE_POLICY_SOURCE_OF_TRUTH,
  DATA_PROTECTION_EMAIL,
  GENERAL_CONTACT_EMAIL,
  OPERATOR_ADDRESS,
  OPERATOR_DPO,
  OPERATOR_LEGAL_NAME,
  OPERATOR_RC,
  companyLegalUrl,
} from "@/lib/legal";

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

  it("points Kompleet /terms and /privacy at the company pages", () => {
    const terms = readFileSync(
      resolve(process.cwd(), "src/app/(public)/terms/page.tsx"),
      "utf8",
    );
    const privacy = readFileSync(
      resolve(process.cwd(), "src/app/(public)/privacy/page.tsx"),
      "utf8",
    );
    expect(terms).toMatch(/CompanyLegalNotice page="terms"/);
    expect(privacy).toMatch(/CompanyLegalNotice page="privacy"/);
  });

  it("pins the registered operator as Ivano Technologies Ltd RC 9326735 in Abuja", () => {
    expect(OPERATOR_LEGAL_NAME).toBe("Ivano Technologies Ltd");
    expect(OPERATOR_RC).toBe("RC 9326735");
    expect(OPERATOR_RC).not.toBe("RC 8736090");
    expect(OPERATOR_ADDRESS).toMatch(/Wuse 2, Abuja, FCT/);
    expect(OPERATOR_DPO).toBe("David Inalegwu");
    expect(DATA_PROTECTION_EMAIL).toBe("support@ivanotechnologies.com");
    expect(GENERAL_CONTACT_EMAIL).toBe("hi@ivanotechnologies.com");
    expect(COOKIE_POLICY_SOURCE_OF_TRUTH).toMatch(/source of truth/);
  });
});
