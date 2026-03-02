import { calculateConfidence, toConfidenceBucket } from "./calculate-confidence";
import { detectAnchors } from "./detect-anchors";
import { mapInvoiceFields } from "./map-invoice-fields";
import { normalizeText } from "./normalize-text";
import { hashStructuredOutput } from "./structured-output-hash";
import type { InvoiceEntity } from "../../domain/invoice.entity";

export interface ExtractionResult {
  invoice: InvoiceEntity;
  confidenceScore: number;
  confidenceBucket: ReturnType<typeof toConfidenceBucket>;
  structuredData: Record<string, unknown>;
}

export function extractInvoiceStructuredOutput(
  ocrData: Record<string, unknown>,
): ExtractionResult {
  const normalizedText = normalizeText(safeString(ocrData.rawText, ""));
  const anchors = detectAnchors(normalizedText);
  const mapped = mapInvoiceFields(ocrData, anchors);
  const ocrConfidence = safeNumber(ocrData.confidenceScore, 0);
  const confidenceScore = calculateConfidence({
    ocrConfidence,
    invoice: mapped.invoice,
    anchors,
  });
  const confidenceBucket = toConfidenceBucket(confidenceScore);
  const structuredHash = hashStructuredOutput(mapped.structuredData);

  return {
    invoice: mapped.invoice,
    confidenceScore,
    confidenceBucket,
    structuredData: {
      ...mapped.structuredData,
      __deterministicHash: structuredHash,
      __metadata: {
        extractionVersion: "v1",
        structuredHash,
        confidenceBucket,
        anchorCoverage: mapped.anchorCoverage,
      },
    },
  };
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
