/** Canonical Ivano Technologies Ltd legal pages (company site). */
export const COMPANY_ORIGIN = "https://www.ivanotechnologies.com";

export const COMPANY_LEGAL = {
  terms: `${COMPANY_ORIGIN}/terms`,
  privacy: `${COMPANY_ORIGIN}/privacy`,
  refunds: `${COMPANY_ORIGIN}/refunds`,
} as const;

/** Registered operator of Kompleet. Never use RC 8736090. */
export const OPERATOR_LEGAL_NAME = "Ivano Technologies Ltd";
export const OPERATOR_RC = "RC 9326735";
export const OPERATOR_ADDRESS =
  "Shop B18, Saham Plaza, No. 10 Alexandria Crescent, Wuse 2, Abuja, FCT, Nigeria";
export const OPERATOR_DPO = "David Inalegwu";
export const OPERATOR_WEBSITE_HREF = COMPANY_ORIGIN;
export const DATA_PROTECTION_EMAIL = "support@ivanotechnologies.com";
export const GENERAL_CONTACT_EMAIL = "hi@ivanotechnologies.com";
export const COOKIE_POLICY_SOURCE_OF_TRUTH =
  "This Cookie Policy is the source of truth for cookies used on Kompleet.";

export type CompanyLegalPage = keyof typeof COMPANY_LEGAL;

export function companyLegalUrl(page: CompanyLegalPage): string {
  switch (page) {
    case "terms":
      return COMPANY_LEGAL.terms;
    case "privacy":
      return COMPANY_LEGAL.privacy;
    case "refunds":
      return COMPANY_LEGAL.refunds;
    default: {
      const _exhaustive: never = page;
      throw new Error(`Unknown company legal page: ${_exhaustive}`);
    }
  }
}
