import type { InvoiceEntity } from "../../domain/invoice.entity";
import type { DetectedAnchors } from "./detect-anchors";

export interface ConfidenceInputs {
  ocrConfidence: number;
  invoice: InvoiceEntity;
  anchors: DetectedAnchors;
}

export type ConfidenceBucket =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export function calculateConfidence(inputs: ConfidenceInputs): number {
  const normalizedOcrConfidence = clamp(inputs.ocrConfidence, 0, 100);
  const completeness = fieldCompletenessScore(inputs.invoice);
  const anchorCoverage = (inputs.anchors.matchedAnchors.length / 7) * 100;

  const weightedScore =
    normalizedOcrConfidence * 0.6 + completeness * 0.25 + anchorCoverage * 0.15;

  return Math.round(clamp(weightedScore, 0, 100) * 100) / 100;
}

export function toConfidenceBucket(score: number): ConfidenceBucket {
  if (score < 50) return "very_low";
  if (score < 70) return "low";
  if (score < 85) return "medium";
  if (score < 95) return "high";
  return "very_high";
}

function fieldCompletenessScore(invoice: InvoiceEntity): number {
  const requiredFields = [
    hasMeaningfulValue(invoice.invoiceNumber),
    hasMeaningfulValue(invoice.vendorName),
    hasMeaningfulValue(invoice.issueDate),
    hasMeaningfulValue(invoice.currency),
    invoice.subtotal > 0,
    invoice.vatAmount >= 0,
    invoice.totalAmount > 0,
  ];
  const score = (requiredFields.filter(Boolean).length / requiredFields.length) * 100;
  return Math.round(score * 100) / 100;
}

function hasMeaningfulValue(value: string): boolean {
  return value.length > 0 && value !== "unknown" && value !== new Date(0).toISOString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
