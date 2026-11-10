import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COOKIE_POLICY_SOURCE_OF_TRUTH,
  DATA_PROTECTION_EMAIL,
  GENERAL_CONTACT_EMAIL,
  OPERATOR_ADDRESS,
  OPERATOR_DPO,
  OPERATOR_LEGAL_NAME,
  OPERATOR_RC,
  OPERATOR_WEBSITE_HREF,
} from "@/lib/legal";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const privacy = read("src/app/(public)/privacy/page.tsx");
const terms = read("src/app/(public)/terms/page.tsx");
const contact = read("src/app/(public)/contact/page.tsx");
const cookies = read("src/app/(public)/cookies/page.tsx");
const operatorDetails = read("src/components/legal/OperatorDetails.tsx");
const legalPages = [privacy, terms, contact, cookies];

describe("operator identity on legal and contact pages", () => {
  it("publishes RC 9326735, the Abuja address, and DPO David Inalegwu", () => {
    expect(OPERATOR_LEGAL_NAME).toBe("Ivano Technologies Ltd");
    expect(OPERATOR_RC).toBe("RC 9326735");
    expect(OPERATOR_ADDRESS).toBe(
      "Shop B18, Saham Plaza, No. 10 Alexandria Crescent, Wuse 2, Abuja, FCT, Nigeria",
    );
    expect(OPERATOR_DPO).toBe("David Inalegwu");
    expect(OPERATOR_WEBSITE_HREF).toBe("https://www.ivanotechnologies.com");
    expect(operatorDetails).toMatch(/OPERATOR_RC/);
    expect(operatorDetails).toMatch(/OPERATOR_ADDRESS/);
    expect(operatorDetails).toMatch(/OPERATOR_DPO/);
    expect(operatorDetails).toMatch(/OPERATOR_WEBSITE_HREF/);
    expect(operatorDetails).not.toMatch(/techivano\.com/);
    expect(operatorDetails).toMatch(/const websiteLabel = websiteHref\.replace/);
    expect(privacy).toMatch(/showWebsite/);
    expect(terms).toMatch(/showWebsite/);
    expect(privacy).not.toMatch(/websiteHref=/);
    expect(terms).not.toMatch(/websiteHref=/);
    for (const page of legalPages) {
      expect(page).toMatch(/OperatorDetails/);
      expect(page).not.toMatch(/RC 8736090/);
    }
  });

  it("sends data-protection requests to support and keeps general contact on hi@", () => {
    expect(DATA_PROTECTION_EMAIL).toBe("support@ivanotechnologies.com");
    expect(GENERAL_CONTACT_EMAIL).toBe("hi@ivanotechnologies.com");
    expect(privacy).toMatch(/mailto:support@ivanotechnologies.com/);
    expect(terms).toMatch(/mailto:support@ivanotechnologies.com/);
    expect(contact).toMatch(/mailto:hi@ivanotechnologies.com/);
    expect(contact).toMatch(/mailto:support@ivanotechnologies.com/);
    expect(contact).toMatch(/Support and data-protection requests/);
  });

  it("replaces Lagos on the contact office card with name and address only", () => {
    expect(contact).not.toMatch(/Lagos, Nigeria/);
    expect(contact).toMatch(/showEmails=\{false\}/);
    expect(contact).toMatch(/showRc=\{false\}/);
    expect(contact).toMatch(/showDpo=\{false\}/);
    expect(privacy).not.toMatch(/showRc=\{false\}/);
    expect(terms).not.toMatch(/showDpo=\{false\}/);
  });
});

describe("email sign-in copy on Privacy and Terms", () => {
  it("does not mention Google OAuth or Sign in with Google", () => {
    expect(privacy).not.toMatch(/Google OAuth/i);
    expect(privacy).not.toMatch(/Sign in with Google/i);
    expect(terms).not.toMatch(/Google OAuth/i);
    expect(terms).not.toMatch(/Sign in with Google/i);
  });

  it("describes email-and-password sign-in in Privacy §2 and Terms §3.1", () => {
    expect(privacy).toMatch(
      /You sign in to Kompleet with your email address and password/,
    );
    expect(privacy).not.toMatch(/You sign in to KOMPLEET/);
    expect(terms).toMatch(/Valid email address/);
    expect(terms).toMatch(/Secure password/);
    expect(terms).not.toMatch(/third-party provider/);
  });
});

describe("Cookie Policy source of truth and theme copy", () => {
  it("states that this Cookie Policy is the source of truth", () => {
    expect(COOKIE_POLICY_SOURCE_OF_TRUTH).toBe(
      "This Cookie Policy is the source of truth for cookies used on Kompleet.",
    );
    expect(cookies).toMatch(/COOKIE_POLICY_SOURCE_OF_TRUTH/);
    expect(cookies).not.toMatch(
      /Last updated: 10 November 2026\. \{COOKIE_POLICY_SOURCE_OF_TRUTH\}/,
    );
    expect(cookies).not.toMatch(/CompanyLegalNotice/);
  });

  it("does not mention light or dark mode", () => {
    expect(cookies).not.toMatch(/light\/dark/i);
    expect(cookies).not.toMatch(/dark mode/i);
  });
});
