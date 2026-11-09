import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COMPANY_LEGAL, companyLegalUrl } from "@/lib/legal";

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
});
