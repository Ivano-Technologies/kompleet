export const TAX_COPY = {
  title: "Tax",
  cardTitle: "Generate from books",
  period: "Period",
  entity: "Entity",
  entityPit: "Individual (PIT)",
  entityCit: "Company (CIT)",
  entityVat: "VAT return",
  summary: "From imported books",
  cta: "Generate report",
  advanced: "Advanced · override figures",
  toast: "Report ready",
  warnUncat: (n: number) => `${n} uncategorized — totals may be incomplete`,
  warnReview: "Review",
  overrideTitle: "Override figures",
  overrideEyebrow:
    "Books already have your totals. Override only if you need different numbers.",
  overrideBack: "Back to Tax",
  emptyNoBooks: "Drop a statement first",
  emptyImportCta: "Import",
  filingGenTitle: "Generate filing package",
  filingGenCta: "Generate PDF",
  filingToast: "Filing form ready",
  filingMark: "Mark as filed",
  filingConfirm: "Confirmation number",
  filingSourceBooks: "From books",
  filingSourceOverride: "Override figures",
} as const;

export type TaxEntity = "pit" | "cit" | "vat";

export function periodBounds(periodKey: string): {
  startDate: string;
  endDate: string;
  taxYear: number;
  label: string;
} {
  const match = /^(\d{4})-(Q[1-4]|FY)$/.exec(periodKey);
  const year = match ? Number(match[1]) : new Date().getFullYear();
  const part = match?.[2] ?? "FY";
  const pad = (month: number, day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (part === "Q1") {
    return { startDate: pad(1, 1), endDate: pad(3, 31), taxYear: year, label: `Q1 ${year} (Jan–Mar)` };
  }
  if (part === "Q2") {
    return { startDate: pad(4, 1), endDate: pad(6, 30), taxYear: year, label: `Q2 ${year} (Apr–Jun)` };
  }
  if (part === "Q3") {
    return { startDate: pad(7, 1), endDate: pad(9, 30), taxYear: year, label: `Q3 ${year} (Jul–Sep)` };
  }
  if (part === "Q4") {
    return { startDate: pad(10, 1), endDate: pad(12, 31), taxYear: year, label: `Q4 ${year} (Oct–Dec)` };
  }
  return {
    startDate: pad(1, 1),
    endDate: pad(12, 31),
    taxYear: year,
    label: `${year} (full year)`,
  };
}

export function defaultPeriodKey(now = new Date()): string {
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

export function periodOptions(now = new Date()): { key: string; label: string }[] {
  const year = now.getFullYear();
  const years = [year, year - 1];
  const keys: string[] = [];
  for (const y of years) {
    keys.push(`${y}-Q1`, `${y}-Q2`, `${y}-Q3`, `${y}-Q4`, `${y}-FY`);
  }
  return keys.map((key) => ({ key, label: periodBounds(key).label }));
}

export function entityToGenerateArgs(entity: TaxEntity): {
  reportType: string;
  businessType: "individual" | "other_company";
} {
  if (entity === "pit") {
    return { reportType: "income_tax", businessType: "individual" };
  }
  if (entity === "vat") {
    return { reportType: "vat", businessType: "other_company" };
  }
  return { reportType: "income_tax", businessType: "other_company" };
}
