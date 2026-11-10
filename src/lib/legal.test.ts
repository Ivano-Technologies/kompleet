import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL,
  COMPANY_NAME,
  COMPANY_RC,
  DPO_NAME,
  DSR_EMAIL,
  DSR_RESPONSE_DAYS,
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

  it("exports the controller identity used on product legal pages", () => {
    expect(COMPANY_NAME).toBe("Ivano Technologies Ltd");
    expect(COMPANY_RC).toBe("RC 9326735");
    expect(COMPANY_ADDRESS).toBe(
      "Shop B18, Saham Plaza, No. 10 Alexandria Crescent, Wuse 2, Abuja",
    );
    expect(DPO_NAME).toBe("David Inalegwu");
    expect(DSR_EMAIL).toBe("support@ivanotechnologies.com");
    expect(DSR_RESPONSE_DAYS).toBe(30);
  });
});
