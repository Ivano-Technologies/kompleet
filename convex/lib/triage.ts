export const LOW_CONFIDENCE_THRESHOLD = 80;

export type TransactionTriageReason = "uncategorised" | "low_confidence";

export function transactionTriageReason(row: {
  categoryId?: unknown;
  confidenceScore?: number;
  triageIgnoredAt?: number;
}): TransactionTriageReason | null {
  if (row.triageIgnoredAt) return null;
  if (!row.categoryId) return "uncategorised";
  if (
    typeof row.confidenceScore === "number" &&
    row.confidenceScore < LOW_CONFIDENCE_THRESHOLD
  ) {
    return "low_confidence";
  }
  return null;
}
