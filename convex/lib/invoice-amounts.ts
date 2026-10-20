/**
 * IVA-190: price invoice lines on the server from quantity, rate, discount
 * and VAT rate. Client-sent amounts are ignored.
 */
import { ConvexError } from "convex/values";
import {
  DISCOUNT_TOO_BIG,
  NEGATIVE_QUANTITY,
  NEGATIVE_UNIT_PRICE,
  discountTooBig,
  lineDiscount,
  lineNetAmount,
  totalsFromLines,
  type LineInput,
} from "./line-amounts";

export type PricedInvoiceAmounts = {
  lineItems: unknown;
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
};

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function linePrefix(index: number, message: string): string {
  return `Line item ${index + 1}: ${message}`;
}

function priceOneLine(item: unknown, index: number): Record<string, unknown> & LineInput {
  if (!item || typeof item !== "object") {
    throw new ConvexError("We couldn't save this invoice. Check the line amounts and try again.");
  }
  const row = item as Record<string, unknown>;
  const quantity = finiteNumber(row.quantity);
  const unit_price = finiteNumber(row.unit_price);
  const vat_rate = finiteNumber(row.vat_rate);
  const discount = finiteNumber(row.discount);

  if (typeof row.quantity === "number" && row.quantity < 0) {
    throw new ConvexError(linePrefix(index, NEGATIVE_QUANTITY));
  }
  if (typeof row.unit_price === "number" && row.unit_price < 0) {
    throw new ConvexError(linePrefix(index, NEGATIVE_UNIT_PRICE));
  }

  const line: LineInput = { quantity, unit_price, vat_rate, discount };
  if (discountTooBig(line)) {
    throw new ConvexError(linePrefix(index, DISCOUNT_TOO_BIG));
  }

  const pricedDiscount = lineDiscount(line);
  return {
    ...row,
    quantity,
    unit_price,
    vat_rate,
    ...(pricedDiscount ? { discount: pricedDiscount } : {}),
    amount: lineNetAmount(line),
  };
}

/**
 * Recompute each line's net amount plus Subtotal, VAT and Total.
 * `raw` client amounts (line.amount, totals) are not used.
 */
export function priceInvoiceLines(raw: unknown): PricedInvoiceAmounts {
  if (raw == null) {
    return {
      lineItems: raw,
      subtotal: 0,
      vatAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
    };
  }
  if (!Array.isArray(raw)) {
    throw new ConvexError("We couldn't save this invoice. Check the line amounts and try again.");
  }
  const lineItems = raw.map(priceOneLine);
  const totals = totalsFromLines(lineItems);
  return {
    lineItems,
    subtotal: totals.subtotal,
    vatAmount: totals.vat_amount,
    discountAmount: totals.discount_amount,
    totalAmount: totals.total_amount,
  };
}

export function lineItemsFromPatch(
  patch: Record<string, unknown>,
  fallback: unknown,
): unknown {
  if ("lineItems" in patch) return patch.lineItems;
  if ("line_items" in patch) return patch.line_items;
  return fallback;
}
