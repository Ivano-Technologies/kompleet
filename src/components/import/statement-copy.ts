export const DROP_COPY = {
  heroTitle: "Drop your bank statement (CSV, Excel, or PDF)",
  heroSub: "We'll detect the bank and update your books.",
  heroChoose: "Choose file",
  heroWhy: "Why we need a statement",
  whyBody:
    "Your statement is how books start. We read the file, detect the bank, and post income and expenses so dashboards, invoices, and tax have real numbers — not a form you retype.",
  stripTitle: "Drop another statement to update books",
  stripChoose: "Choose file",
  ctaImport: "Drop statement",
  ctaImportShort: "Import",
  ctaInvoice: "New invoice",
  toastSuccess: (n: number) => `${n} transactions added · books updated`,
  toastViewBooks: "View books",
  toastReview: (n: number) => `Fix ${n} uncategorized`,
  toastDuplicates: "Resolve duplicates",
  bannerReview: (n: number) => `${n} need a quick check`,
  bannerReviewCta: "Review",
  bannerDuplicates: (d: number) => `${d} possible duplicates`,
  bannerDuplicatesCta: "Resolve",
  progress: "Updating books…",
  advanced: "Advanced · choose bank",
  password: "This PDF is password-protected",
  emptyTaxNudge: "Drop a statement first",
} as const;

export const DEFAULT_BANK_CODE = "AUTO";
export const FALLBACK_BANK_CODE = "GENERIC";
