import type { InvoiceEntity } from "../../domain/invoice.entity";
import type { DetectedAnchors } from "./detect-anchors";

export interface MappedInvoiceFields {
  invoice: InvoiceEntity;
  structuredData: Record<string, unknown>;
  anchorCoverage: number;
}

export function mapInvoiceFields(
  ocrData: Record<string, unknown>,
  anchors: DetectedAnchors,
): MappedInvoiceFields {
  const subtotal = safeNumber(ocrData.subtotal, anchors.subtotal ?? 0);
  const vatAmount = safeNumber(ocrData.vatAmount, anchors.vatAmount ?? 0);
  const totalAmount = safeNumber(
    ocrData.totalAmount,
    anchors.totalAmount ?? subtotal + vatAmount,
  );

  const invoice: InvoiceEntity = {
    invoiceNumber: safeString(
      ocrData.invoiceNumber,
      anchors.invoiceNumber ?? "unknown",
    ),
    vendorName: safeString(ocrData.vendorName, anchors.vendorName ?? "unknown"),
    issueDate: safeString(
      ocrData.issueDate,
      anchors.issueDate ?? new Date(0).toISOString(),
    ),
    currency: safeString(ocrData.currency, anchors.currency ?? "NGN"),
    subtotal,
    vatAmount,
    totalAmount,
    lineItems: [],
  };

  const structuredData: Record<string, unknown> = {
    invoiceNumber: invoice.invoiceNumber,
    vendorName: invoice.vendorName,
    issueDate: invoice.issueDate,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    vatAmount: invoice.vatAmount,
    totalAmount: invoice.totalAmount,
    confidenceScore: safeNumber(ocrData.confidenceScore, 0),
    textHash: safeString(ocrData.textHash, ""),
    pageCount: safeNumber(ocrData.pageCount, 1),
    fileSizeBytes: safeNumber(ocrData.fileSizeBytes, 0),
    lineItems: [],
  };

  return {
    invoice,
    structuredData,
    anchorCoverage: calculateAnchorCoverage(anchors),
  };
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function calculateAnchorCoverage(anchors: DetectedAnchors): number {
  const expectedAnchorCount = 7;
  const ratio = anchors.matchedAnchors.length / expectedAnchorCount;
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100) / 100;
}
