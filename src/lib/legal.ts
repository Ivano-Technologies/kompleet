/** Canonical Ivano Technologies Ltd legal pages (company site). */
export const COMPANY_ORIGIN = "https://www.ivanotechnologies.com";

export const COMPANY_LEGAL = {
  terms: `${COMPANY_ORIGIN}/terms`,
  privacy: `${COMPANY_ORIGIN}/privacy`,
  refunds: `${COMPANY_ORIGIN}/refunds`,
} as const;

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
