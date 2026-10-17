/**
 * IVA-185: invoice line maths, shared by the create route, the full form,
 * the preview and the PDF. Pure, so it is safe in client components.
 *
 * A line amount is the pre-VAT net: quantity x rate minus any line discount.
 * Line amounts add up to the Subtotal, and Subtotal + VAT = Total.
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

/** Same rounding the invoice totals have always used (2dp, naira). */
const round2 = (value: number) => Number(value.toFixed(2));

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Pre-VAT line amount: quantity x rate minus line discount. */
export function lineNetAmount(item: LineInput): number {
  return round2(num(item.quantity) * num(item.unit_price) - num(item.discount));
}

export function totalsFromLines(items: LineInput[]): {
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total_amount: number;
} {
  let subtotal = 0;
  let vat = 0;
  let discount = 0;
  for (const item of items) {
    const net = num(item.quantity) * num(item.unit_price) - num(item.discount);
    subtotal += net;
    vat += (net * num(item.vat_rate)) / 100;
    discount += num(item.discount);
  }
  subtotal = round2(subtotal);
  vat = round2(vat);
  return {
    subtotal,
    vat_amount: vat,
    discount_amount: round2(discount),
    total_amount: round2(subtotal + vat),
  };
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
    return {
      ...row,
      amount: lineNetAmount({
        quantity: num(row.quantity),
        unit_price: num(row.unit_price),
        vat_rate: num(row.vat_rate),
        discount: num(row.discount),
      }),
    };
  }) as T;
}

/** Same as withNetLineAmounts, for a whole invoice API object. */
export function invoiceWithNetLineAmounts<T extends { line_items?: unknown }>(invoice: T): T {
  if (!invoice || !Array.isArray(invoice.line_items)) return invoice;
  return { ...invoice, line_items: withNetLineAmounts(invoice.line_items) };
}
