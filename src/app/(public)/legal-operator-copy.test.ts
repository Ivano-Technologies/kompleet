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
    expect(contact).toMatch(/OperatorDetails/);
    // IVA-224: Privacy, Terms and the Cookie Notice carry the operator line
    // from the 12 November drafts, built from the same constants.
    for (const page of [privacy, terms, cookies]) {
      expect(page).toMatch(
        /\{OPERATOR_LEGAL_NAME\}, \{OPERATOR_RC\}, \{OPERATOR_ADDRESS\}\./,
      );
      expect(page).not.toMatch(/RC \d/);
    }
    for (const page of [privacy, terms]) {
      expect(page).toMatch(/\{OPERATOR_DPO\}/);
      expect(page).not.toMatch(/David/);
    }
    for (const page of legalPages) {
      expect(page).not.toMatch(/RC 8736090/);
    }
  });

  it("does not claim NDPC registration on Privacy or the Cookie Notice", () => {
    for (const page of [privacy, cookies]) {
      expect(page).not.toMatch(/NDPC/);
      expect(page).not.toMatch(
        /registered (with|by|under) the Nigeria Data Protection/i,
      );
    }
    expect(terms).not.toMatch(/NDPC[- ]registered/i);
    expect(terms).not.toMatch(
      /registered (with|by|under) the Nigeria Data Protection/i,
    );
    expect(privacy).toMatch(
      /you may complain to the Nigeria Data Protection\s+Commission/,
    );
  });

  it("sends data-protection requests to support and keeps general contact on hi@", () => {
    expect(DATA_PROTECTION_EMAIL).toBe("support@ivanotechnologies.com");
    expect(GENERAL_CONTACT_EMAIL).toBe("hi@ivanotechnologies.com");
    for (const page of [privacy, terms, cookies]) {
      expect(page).toMatch(/mailto:\$\{DATA_PROTECTION_EMAIL\}/);
    }
    expect(privacy).not.toMatch(/@ivanotechnologies\.com/);
    expect(cookies).not.toMatch(/@ivanotechnologies\.com/);
    expect(privacy).toMatch(/mailto:\$\{GENERAL_CONTACT_EMAIL\}/);
    expect(terms).toMatch(/mailto:\$\{GENERAL_CONTACT_EMAIL\}/);
    expect(terms).toMatch(/Support, refunds and payment disputes:/);
    expect(terms).toMatch(/General\s+contact:/);
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
      /You sign in with your email address and password,\s+with a verification code sent to your email/,
    );
    expect(privacy).not.toMatch(/You sign in to KOMPLEET/);
    expect(terms).toMatch(/Valid email address/);
    expect(terms).toMatch(/Secure password/);
    expect(terms).not.toMatch(/third-party provider/);
  });
});

describe("Cookie Notice and theme copy", () => {
  it("is titled Cookie Notice and has no company-page notice", () => {
    expect(COOKIE_POLICY_SOURCE_OF_TRUTH).toBe(
      "This Cookie Policy is the source of truth for cookies used on Kompleet.",
    );
    expect(cookies).toMatch(/Cookie Notice/);
    expect(cookies).not.toMatch(/Cookie Policy/);
    expect(cookies).not.toMatch(/CompanyLegalNotice/);
  });

  it("states analytics conditionally and never claims there is none", () => {
    expect(cookies).toMatch(/Analytics \(optional, off unless you accept\)/);
    expect(cookies).toMatch(
      /loads and sets\s+cookies only after you accept optional cookies/,
    );
    expect(cookies).toMatch(/only when a\s+measurement ID is configured/);
    expect(cookies).not.toMatch(/do not use analytics/i);
    expect(cookies).toMatch(/We do not use advertising cookies/);
    expect(cookies).toMatch(/It is not a cookie/);
    expect(cookies).toMatch(/We use Sentry to detect and\s+fix errors/);
  });

  it("does not mention light or dark mode", () => {
    expect(cookies).not.toMatch(/light\/dark/i);
    expect(cookies).not.toMatch(/dark mode/i);
  });
});
