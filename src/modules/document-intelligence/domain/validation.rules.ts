import type { InvoiceEntity } from "./invoice.entity";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  confidenceScore: number;
}

export function validateInvoiceDeterministically(
  invoice: InvoiceEntity,
): ValidationResult {
  const errors: string[] = [];
  const expectedTotal = roundTo2(invoice.subtotal + invoice.vatAmount);
  const providedTotal = roundTo2(invoice.totalAmount);

  if (expectedTotal !== providedTotal) {
    errors.push("Total amount does not reconcile with subtotal + VAT.");
  }

  if (invoice.vatAmount < 0 || invoice.subtotal < 0 || invoice.totalAmount < 0) {
    errors.push("Invoice amounts must be non-negative.");
  }

  const confidenceScore = errors.length === 0 ? 99 : 70;
  return {
    isValid: errors.length === 0,
    errors,
    confidenceScore,
  };
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
