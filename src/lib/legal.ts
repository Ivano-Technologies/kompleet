/** Canonical Ivano Technologies Ltd legal pages (company site). */
export const COMPANY_ORIGIN = "https://www.ivanotechnologies.com";

export const COMPANY_LEGAL = {
  terms: `${COMPANY_ORIGIN}/terms`,
  privacy: `${COMPANY_ORIGIN}/privacy`,
  refunds: `${COMPANY_ORIGIN}/refunds`,
} as const;

/** Controller identity for Kompleet product legal pages. */
export const COMPANY_NAME = "Ivano Technologies Ltd";
export const COMPANY_RC = "RC 9326735";
export const COMPANY_ADDRESS =
  "Shop B18, Saham Plaza, No. 10 Alexandria Crescent, Wuse 2, Abuja";
export const DPO_NAME = "David Inalegwu";
export const DSR_EMAIL = "support@ivanotechnologies.com";
/** NDPA 2023 response window. Confirm with Kezie before treating as a committed SLA. */
export const DSR_RESPONSE_DAYS = 30;
export const NDPC_URL = "https://ndpc.gov.ng";

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
