export const SETUP_COPY = {
  title: "Set up your business",
  sub: "Add your details so invoices show the right sender.",
  subComplete:
    "You\u2019re ready. Sender details will appear on invoices. Tax IDs can wait.",
  progress: (n: number) => `${n} of 4 complete`,
  itemLegalName: "Legal name",
  itemAddress: "Business address",
  itemContact: "Contact (email or phone)",
  itemTax: "Tax IDs (TIN / VAT)",
  itemTaxHint: "optional",
  itemDone: "Done",
  itemAdd: "Add",
  itemSkipped: "Skipped",
  logoDeferred: "Add your logo in Settings",
  logoDeferredSub:
    "Optional. It shows on invoices next to your business name. Not a checklist step.",
  logoDeferredComplete: "Optional and not required to finish setup.",
  ctaPrimary: "Set up business",
  ctaLater: "I\u2019ll do this later",
  ctaDone: "Done",
  bannerTitle: "Set up your business",
  bannerSub: "Add a legal name so invoices show your sender.",
  bannerCta: "Open Settings",
  bannerDismiss: "Dismiss",
  toastComplete:
    "Business profile ready. It\u2019ll show on invoices you send.",
} as const;
