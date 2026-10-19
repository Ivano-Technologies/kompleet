/**
 * IVA-185: invoice line maths, shared by the create route, the full form,
 * the preview and the PDF. Pure, so it is safe in client components.
 *
 * A line amount is the pre-VAT net: quantity x rate minus the line discount
 * (clamped to 0..quantity x rate), rounded half-up to the kobo. The Subtotal is the sum of
 * those rounded amounts, VAT is computed on the Subtotal, and
 * Total = Subtotal + VAT.
 *
 * Older full-form invoices stored `amount` including VAT, so the preview and
 * PDF always recompute the net from quantity, rate and discount instead of
 * trusting the stored `amount`.
 */

export type LineInput = {
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount?: number;
};

/**
 * Money rounding: half-up to the kobo, with integer maths.
 *
 * `halfUpUnits(value, decimals)` returns value x 10^decimals rounded half-up
 * (away from zero for negatives) as an integer. It reads the value through a
 * 15 significant digit decimal string first, so binary float noise cannot flip
 * a tie: 1.5 x 33.33 is 49.99499999999999 as a float but 49.995 as a decimal,
 * and rounds up to 50.00. All sums are then done in whole kobo.
 */
export function halfUpUnits(value: number, decimals: number): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  const sign = value < 0 ? -1 : 1;
  const [mantissa, expPart] = Math.abs(value).toPrecision(15).split("e");
  const exp = Number(expPart ?? 0);
  const dot = mantissa.indexOf(".");
  const digits = mantissa.replace(".", "");
  // Position of the decimal point within `digits`, after scaling by 10^decimals.
  const point = (dot === -1 ? mantissa.length : dot) + exp + decimals;
  if (point < 0) return 0;
  const whole = point === 0 ? "0" : digits.slice(0, point).padEnd(point, "0");
  const next = digits.charAt(point);
  let units = Number(whole);
  if (next !== "" && next >= "5") units += 1;
  return sign * units === 0 ? 0 : sign * units;
}

/** Naira to whole kobo, half-up. */
export const toKobo = (naira: number) => halfUpUnits(naira, 2);
/** Whole kobo back to naira. */
const fromKobo = (kobo: number) => kobo / 100;

/** Money rounded half-up to 2dp (the kobo). */
export const roundMoney = (naira: number) => fromKobo(toKobo(naira));

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Friendly form copy when a line discount is larger than the line total. */
export const DISCOUNT_TOO_BIG = "Discount can't be more than the line total.";

/** quantity x rate, before discount and VAT. */
export function lineGrossAmount(item: LineInput): number {
  return num(item.quantity) * num(item.unit_price);
}

/** The line discount in kobo, clamped to 0..(quantity x rate). */
function lineDiscountKobo(item: LineInput): number {
  const grossKobo = Math.max(0, toKobo(lineGrossAmount(item)));
  return Math.min(Math.max(0, toKobo(num(item.discount))), grossKobo);
}

/** The line discount clamped to 0..(quantity x rate), to the kobo. */
export function lineDiscount(item: LineInput): number {
  return fromKobo(lineDiscountKobo(item));
}

/**
 * True when the entered discount is larger than the line total shown
 * (quantity x rate, half-up to the kobo). Compared in whole kobo, so a 50.00
 * discount on a 1.5 x 33.33 line (shown as 50.00) is allowed.
 */
export function discountTooBig(item: LineInput): boolean {
  return toKobo(num(item.discount)) > Math.max(0, toKobo(lineGrossAmount(item)));
}

/** Pre-VAT line amount in kobo: quantity x rate (half-up to the kobo) minus the clamped discount. */
function lineNetKobo(item: LineInput): number {
  return toKobo(lineGrossAmount(item)) - lineDiscountKobo(item);
}

/** Pre-VAT line amount, half-up to the kobo: quantity x rate minus the clamped discount. */
export function lineNetAmount(item: LineInput): number {
  return fromKobo(lineNetKobo(item));
}

export type LineTotals = {
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total_amount: number;
};

/**
 * The one place invoice totals are built.
 * Subtotal is the sum of the rounded line amounts, so the rows always add up.
 * VAT is computed on the Subtotal (per VAT rate, from the same rounded line
 * amounts) and Total = Subtotal + VAT.
 */
export function totalsFromLines(items: LineInput[]): LineTotals {
  // All in whole kobo, so sums are exact.
  let subtotalKobo = 0;
  let discountKobo = 0;
  for (const item of items) {
    subtotalKobo += lineNetKobo(item);
    discountKobo += lineDiscountKobo(item);
  }
  const vatKobo = vatGroupsKobo(items).reduce((sum, group) => sum + group.vatKobo, 0);
  return {
    subtotal: fromKobo(subtotalKobo),
    vat_amount: fromKobo(vatKobo),
    discount_amount: fromKobo(discountKobo),
    total_amount: fromKobo(subtotalKobo + vatKobo),
  };
}

/** VAT per rate group, in kobo: each group's base is its rounded line amounts, VAT half-up to the kobo. */
function vatGroupsKobo(items: LineInput[]): Array<{ rate: number; baseKobo: number; vatKobo: number }> {
  const byRate = new Map<number, number>();
  for (const item of items) {
    const rate = num(item.vat_rate);
    byRate.set(rate, (byRate.get(rate) ?? 0) + lineNetKobo(item));
  }
  return [...byRate].map(([rate, baseKobo]) => ({
    rate,
    baseKobo,
    vatKobo: halfUpUnits((baseKobo * rate) / 100, 0),
  }));
}

export type VatLine = { rate: number; base: number; vat: number };

/** How the invoice writes a VAT rate (the PDF VAT column): "7.5%", no brackets. */
export const vatRateText = (rate: number) => `${rate}%`;

/** Label for a per-rate VAT row: the invoice's "VAT" totals label plus its rate format, e.g. "VAT 7.5%". */
export const vatRowLabel = (rate: number) => `VAT ${vatRateText(rate)}`;

/**
 * The VAT that makes up `totalsFromLines().vat_amount`, one entry per non-zero
 * rate, highest rate first. The entries add up to vat_amount exactly, so a
 * summary with one VAT row per rate matches the invoice totals.
 */
export function vatByRate(items: LineInput[]): VatLine[] {
  return vatGroupsKobo(items)
    .filter((group) => group.rate !== 0)
    .sort((a, b) => b.rate - a.rate)
    .map((group) => ({ rate: group.rate, base: fromKobo(group.baseKobo), vat: fromKobo(group.vatKobo) }));
}

/** True when at least one line has a (clamped) discount, so a Discount column should show. */
export function hasLineDiscount(items: LineInput[]): boolean {
  return items.some((item) => lineDiscount(item) > 0);
}

/**
 * Return line items with `amount` set to the pre-VAT net. Used where stored
 * invoice lines leave the server (GET /api/invoices, GET /api/invoices/[id]),
 * so older full-form invoices never show VAT inclusive line amounts.
 * Non-array input is returned unchanged.
 */
export function withNetLineAmounts<T>(lineItems: T): T {
  if (!Array.isArray(lineItems)) return lineItems;
  return lineItems.map((item) => {
    if (!item || typeof item !== "object") return item;
    const row = item as Record<string, unknown>;
    const line = {
      quantity: num(row.quantity),
      unit_price: num(row.unit_price),
      vat_rate: num(row.vat_rate),
      discount: num(row.discount),
    };
    return {
      ...row,
      ...(line.discount ? { discount: lineDiscount(line) } : {}),
      amount: lineNetAmount({
        quantity: num(row.quantity),
        unit_price: num(row.unit_price),
        vat_rate: num(row.vat_rate),
        discount: num(row.discount),
      }),
    };
  }) as T;
}

/**
 * Same as withNetLineAmounts, for a whole invoice API object. When it has
 * lines, subtotal, vat_amount and total_amount are rebuilt with
 * totalsFromLines so the rows always add up.
 */
export function invoiceWithNetLineAmounts<T extends { line_items?: unknown }>(invoice: T): T {
  if (!invoice || !Array.isArray(invoice.line_items) || invoice.line_items.length === 0) {
    return invoice;
  }
  const lines = withNetLineAmounts(invoice.line_items) as LineInput[];
  const totals = totalsFromLines(lines);
  const out: Record<string, unknown> = { ...invoice, line_items: lines };
  for (const key of ["subtotal", "vat_amount", "total_amount"] as const) {
    if (key in out) out[key] = totals[key];
  }
  if ("amount_due" in out && out.amount_due === (invoice as Record<string, unknown>).total_amount) {
    out.amount_due = totals.total_amount;
  }
  return out as T;
}

/** Totals to display for an invoice: rebuilt from its lines when it has any, else the stored values. */
export function displayTotals(invoice: {
  line_items?: unknown;
  subtotal?: number | null;
  vat_amount?: number | null;
  total_amount?: number | null;
}): { subtotal: number; vat_amount: number; total_amount: number } {
  if (Array.isArray(invoice.line_items) && invoice.line_items.length > 0) {
    const t = totalsFromLines(withNetLineAmounts(invoice.line_items) as LineInput[]);
    return { subtotal: t.subtotal, vat_amount: t.vat_amount, total_amount: t.total_amount };
  }
  return {
    subtotal: num(invoice.subtotal),
    vat_amount: num(invoice.vat_amount),
    total_amount: num(invoice.total_amount),
  };
}
