export type ConfidenceDistributionBucket =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export interface MetricsPort {
  recordDuplicateClaim(documentId: string): void;
  recordSkipCompleted(documentId: string): void;
  recordSkipProcessing(documentId: string): void;
  recordValidationMismatch(documentId: string): void;
  recordLowConfidence(documentId: string, confidenceScore: number): void;
  recordConfidenceDistribution(
    documentId: string,
    bucket: ConfidenceDistributionBucket,
    confidenceScore: number,
  ): void;
  recordStuckProcessingDetected(documentId: string): void;
  recordRecoveryRequeue(documentId: string): void;
}
