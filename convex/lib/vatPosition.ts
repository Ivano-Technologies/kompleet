/**
 * VAT position for a period (IVA-321).
 *
 * Output VAT is the VAT stored on invoices issued in the period. Input VAT is
 * the VAT stored on expenses dated in the period. Net VAT is output minus
 * input. Nothing here applies a VAT rate: only stored `vatAmount` values are
 * added up, so no tax rule value lives in this file.
 */

/** Marks `computationData` written by the VAT computation. */
export const VAT_REPORT_KIND = "vat";

/** Statuses that never count as an issued invoice. */
const EXCLUDED_INVOICE_STATUSES = new Set(["draft", "cancelled"]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Nigeria is UTC+1 all year, with no daylight saving. */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export type VatInvoiceRow = {
  status: string;
  invoiceDate?: string | null;
  issuedAt?: number | null;
  vatAmount?: number | null;
};

export type VatExpenseRow = {
  date: string;
  vatAmount?: number | null;
};

export type VatPosition = {
  kind: typeof VAT_REPORT_KIND;
  period_start: string;
  period_end: string;
  output_vat: number;
  input_vat: number;
  net_vat: number;
  invoice_count: number;
  expense_count: number;
};

function toKobo(amount: number | null | undefined): number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

function fromKobo(kobo: number): number {
  return kobo / 100;
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/**
 * The date an issued invoice counts on: the invoice date written on it, or,
 * when that is missing, the Lagos calendar day it was issued. Returns null
 * for an invoice that was never issued.
 */
export function invoiceIssueDate(row: VatInvoiceRow): string | null {
  if (EXCLUDED_INVOICE_STATUSES.has(row.status)) return null;
  if (typeof row.issuedAt !== "number") return null;
  const written = row.invoiceDate?.slice(0, 10);
  if (written && ISO_DATE.test(written)) return written;
  return new Date(row.issuedAt + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

export function assertVatPeriod(periodStart: string, periodEnd: string): void {
  if (!ISO_DATE.test(periodStart) || !ISO_DATE.test(periodEnd)) {
    throw new Error("VAT period dates must be YYYY-MM-DD");
  }
  if (periodStart > periodEnd) {
    throw new Error("VAT period start must not be after its end");
  }
}

export function computeVatPosition(args: {
  invoices: VatInvoiceRow[];
  expenses: VatExpenseRow[];
  periodStart: string;
  periodEnd: string;
}): VatPosition {
  assertVatPeriod(args.periodStart, args.periodEnd);

  let outputKobo = 0;
  let invoiceCount = 0;
  for (const invoice of args.invoices) {
    const issued = invoiceIssueDate(invoice);
    if (!issued || !inPeriod(issued, args.periodStart, args.periodEnd)) {
      continue;
    }
    outputKobo += toKobo(invoice.vatAmount);
    invoiceCount += 1;
  }

  let inputKobo = 0;
  let expenseCount = 0;
  for (const expense of args.expenses) {
    const date = expense.date?.slice(0, 10);
    if (!date || !inPeriod(date, args.periodStart, args.periodEnd)) continue;
    inputKobo += toKobo(expense.vatAmount);
    expenseCount += 1;
  }

  return {
    kind: VAT_REPORT_KIND,
    period_start: args.periodStart,
    period_end: args.periodEnd,
    output_vat: fromKobo(outputKobo),
    input_vat: fromKobo(inputKobo),
    net_vat: fromKobo(outputKobo - inputKobo),
    invoice_count: invoiceCount,
    expense_count: expenseCount,
  };
}

/** True when stored report data came from the VAT computation. */
export function isVatComputation(data: unknown): data is VatPosition {
  return (
    !!data &&
    typeof data === "object" &&
    (data as { kind?: unknown }).kind === VAT_REPORT_KIND
  );
}
