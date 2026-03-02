import { logger } from "@/lib/logger";
import type {
  ConfidenceDistributionBucket,
  MetricsPort,
} from "../../application/ports/metrics.port";

export type ProcessingMetricsPort = MetricsPort;

export class ProcessingMetricsAdapter implements MetricsPort {
  private duplicateClaimCount = 0;
  private skipCompletedCount = 0;
  private skipProcessingCount = 0;
  private validationMismatchCount = 0;
  private lowConfidenceCount = 0;
  private confidenceDistributionCounts: Record<ConfidenceDistributionBucket, number> =
    {
      very_low: 0,
      low: 0,
      medium: 0,
      high: 0,
      very_high: 0,
    };
  private stuckProcessingDetectedCount = 0;
  private recoveryRequeueCount = 0;

  recordDuplicateClaim(documentId: string): void {
    this.duplicateClaimCount += 1;
    logger.warn("Duplicate processing claim detected", {
      operation: "worker.document.metrics.duplicate_claim",
      documentId,
      duplicateClaimCount: this.duplicateClaimCount,
    });
  }

  recordSkipCompleted(documentId: string): void {
    this.skipCompletedCount += 1;
    logger.info("Skipped completed document", {
      operation: "worker.document.metrics.skip_completed",
      documentId,
      skipCompletedCount: this.skipCompletedCount,
    });
  }

  recordSkipProcessing(documentId: string): void {
    this.skipProcessingCount += 1;
    logger.info("Skipped already-processing document", {
      operation: "worker.document.metrics.skip_processing",
      documentId,
      skipProcessingCount: this.skipProcessingCount,
    });
  }

  recordValidationMismatch(documentId: string): void {
    this.validationMismatchCount += 1;
    logger.warn("Validation mismatch routed to manual review", {
      operation: "worker.document.metrics.validation_mismatch",
      documentId,
      validationMismatchCount: this.validationMismatchCount,
    });
  }

  recordLowConfidence(documentId: string, confidenceScore: number): void {
    this.lowConfidenceCount += 1;
    logger.warn("Low OCR confidence routed to manual review", {
      operation: "worker.document.metrics.low_confidence",
      documentId,
      confidenceScore,
      lowConfidenceCount: this.lowConfidenceCount,
    });
  }

  recordConfidenceDistribution(
    documentId: string,
    bucket: ConfidenceDistributionBucket,
    confidenceScore: number,
  ): void {
    this.confidenceDistributionCounts[bucket] += 1;
    logger.info("Recorded extraction confidence distribution", {
      operation: "worker.document.metrics.confidence_distribution",
      documentId,
      confidenceScore,
      bucket,
      bucketCount: this.confidenceDistributionCounts[bucket],
    });
  }

  recordStuckProcessingDetected(documentId: string): void {
    this.stuckProcessingDetectedCount += 1;
    logger.warn("Stale processing document detected", {
      operation: "worker.document.metrics.stuck_processing_detected",
      documentId,
      stuckProcessingDetectedCount: this.stuckProcessingDetectedCount,
    });
  }

  recordRecoveryRequeue(documentId: string): void {
    this.recoveryRequeueCount += 1;
    logger.info("Stale processing document requeued", {
      operation: "worker.document.metrics.recovery_requeue",
      documentId,
      recoveryRequeueCount: this.recoveryRequeueCount,
    });
  }
}
