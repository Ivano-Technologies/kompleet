import type {
  ConfidenceDistributionBucket,
  MetricsPort,
} from "../../application/ports/metrics.port";

type CounterMap = Record<string, number>;

export class PrometheusProcessingMetricsAdapter implements MetricsPort {
  private readonly counters: CounterMap = {};

  recordDuplicateClaim(_documentId: string): void {
    this.inc("document_duplicate_claim_total");
  }

  recordSkipCompleted(_documentId: string): void {
    this.inc("document_skip_completed_total");
  }

  recordSkipProcessing(_documentId: string): void {
    this.inc("document_skip_processing_total");
  }

  recordValidationMismatch(_documentId: string): void {
    this.inc("document_validation_mismatch_total");
  }

  recordLowConfidence(_documentId: string, _confidenceScore: number): void {
    this.inc("document_low_confidence_total");
  }

  recordConfidenceDistribution(
    _documentId: string,
    bucket: ConfidenceDistributionBucket,
    _confidenceScore: number,
  ): void {
    this.inc(`document_confidence_bucket_total{bucket="${bucket}"}`);
  }

  recordStuckProcessingDetected(_documentId: string): void {
    this.inc("document_stuck_processing_detected_total");
  }

  recordRecoveryRequeue(_documentId: string): void {
    this.inc("document_recovery_requeue_total");
  }

  renderPrometheusMetrics(): string {
    const keys = Object.keys(this.counters).sort();
    return keys.map((key) => `${key} ${this.counters[key]}`).join("\n");
  }

  private inc(metricName: string): void {
    this.counters[metricName] = (this.counters[metricName] ?? 0) + 1;
  }
}
