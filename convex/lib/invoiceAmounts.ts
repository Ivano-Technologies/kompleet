/**
 * IVA-190: price invoice lines on the server from quantity, rate, discount
 * and VAT rate. Client-sent amounts are ignored.
 */
import { ConvexError } from "convex/values";
import {
  DISCOUNT_TOO_BIG,
  INVALID_QUANTITY,
  INVALID_UNIT_PRICE,
  NEGATIVE_QUANTITY,
  NEGATIVE_UNIT_PRICE,
  VAT_RATE_RANGE,
  discountTooBig,
  lineDiscount,
  lineNetAmount,
  roundMoney,
  totalsFromLines,
  type LineInput,
} from "./lineAmounts";

export type PricedInvoiceAmounts = {
  lineItems: unknown;
  hasLines: boolean;
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
};

const CLIENT_AMOUNT_KEYS = [
  "amount",
  "lineTotal",
  "line_total",
  "vatAmount",
  "vat_amount",
  "subtotal",
  "total",
  "totalAmount",
  "total_amount",
] as const;

export function hasLineItems(raw: unknown): boolean {
  return Array.isArray(raw) && raw.length > 0;
}

export function patchIncludesLines(patch: Record<string, unknown>): boolean {
  return "lineItems" in patch || "line_items" in patch;
}

function requireFinite(value: unknown, message: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ConvexError(message);
  }
  return value;
}

function stripClientAmounts(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if ((CLIENT_AMOUNT_KEYS as readonly string[]).includes(key)) continue;
    out[key] = value;
  }
  return out;
}

function priceOneLine(item: unknown): Record<string, unknown> & LineInput {
  if (!item || typeof item !== "object") {
    throw new ConvexError("We couldn't save this invoice. Check the line amounts and try again.");
  }
  const row = item as Record<string, unknown>;
  const quantity = requireFinite(row.quantity, INVALID_QUANTITY);
  const unitPriceRaw = requireFinite(row.unit_price, INVALID_UNIT_PRICE);
  if (quantity < 0) {
    throw new ConvexError(NEGATIVE_QUANTITY);
  }
  if (unitPriceRaw < 0) {
    throw new ConvexError(NEGATIVE_UNIT_PRICE);
  }
  const unit_price = roundMoney(unitPriceRaw);

  let vat_rate = 0;
  if (row.vat_rate !== undefined) {
    if (typeof row.vat_rate !== "number" || !Number.isFinite(row.vat_rate)) {
      throw new ConvexError(VAT_RATE_RANGE);
    }
    vat_rate = row.vat_rate;
    if (vat_rate < 0 || vat_rate > 100) {
      throw new ConvexError(VAT_RATE_RANGE);
    }
  }

  const discount =
    typeof row.discount === "number" && Number.isFinite(row.discount) ? row.discount : 0;

  const line: LineInput = { quantity, unit_price, vat_rate, discount };
  if (discountTooBig(line)) {
    throw new ConvexError(DISCOUNT_TOO_BIG);
  }

  const pricedDiscount = lineDiscount(line);
  return {
    ...stripClientAmounts(row),
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
 * Empty or missing lines are not priced as zero totals; callers decide.
 */
export function priceInvoiceLines(raw: unknown): PricedInvoiceAmounts {
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) {
    return {
      lineItems: raw == null ? raw : [],
      hasLines: false,
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
    hasLines: true,
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
