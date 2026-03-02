import { describe, expect, it } from "vitest";
import { DocumentRecoverySweeper } from "@/modules/document-intelligence/infrastructure/recovery/document-recovery-sweeper";
import type { AuditLogPort } from "@/modules/document-intelligence/application/ports/audit-log.port";
import type { QueuePort } from "@/modules/document-intelligence/application/ports/queue.port";
import type { ProcessingMetricsPort } from "@/modules/document-intelligence/infrastructure/metrics/processing-metrics";
import type { RecoveryRepository } from "@/modules/document-intelligence/infrastructure/recovery/document-recovery-sweeper";

describe("DocumentRecoverySweeper", () => {
  it("requeues stale processing documents and emits metrics/audit", async () => {
    const repository = createRecoveryRepository();
    const queue = createQueueSpy();
    const auditLog = createAuditSpy();
    const metrics = createMetricsSpy();

    const sweeper = new DocumentRecoverySweeper(
      repository,
      queue,
      auditLog,
      metrics,
      15,
      50,
    );

    const requeuedCount = await sweeper.runSweep();

    expect(requeuedCount).toBe(1);
    expect(repository.requeuedStatus).toBe("queued");
    expect(queue.enqueueCount).toBe(1);
    expect(metrics.stuckDetectedCount).toBe(1);
    expect(metrics.recoveryRequeueCount).toBe(1);
    expect(auditLog.recordCount).toBe(1);
  });
});

function createRecoveryRepository(): RecoveryRepository & {
  requeuedStatus: "processing" | "queued";
} {
  let requeuedStatus: "processing" | "queued" = "processing";

  return {
    get requeuedStatus() {
      return requeuedStatus;
    },
    async findStaleProcessingDocuments() {
      return [
        {
          documentId: "doc-stale-1",
          userId: "user-1",
          idempotencyKey: "idem-stale-1",
          processingStartedAt: new Date(Date.now() - 30 * 60 * 1000),
        },
      ];
    },
    async requeueStaleProcessingDocument() {
      requeuedStatus = "queued";
      return true;
    },
  };
}

function createQueueSpy(): QueuePort & { enqueueCount: number } {
  let enqueueCount = 0;

  return {
    get enqueueCount() {
      return enqueueCount;
    },
    async enqueueDocumentProcessing() {
      enqueueCount += 1;
    },
  };
}

function createAuditSpy(): AuditLogPort & { recordCount: number } {
  let recordCount = 0;

  return {
    get recordCount() {
      return recordCount;
    },
    async record() {
      recordCount += 1;
    },
  };
}

function createMetricsSpy(): ProcessingMetricsPort & {
  stuckDetectedCount: number;
  recoveryRequeueCount: number;
} {
  let stuckDetectedCount = 0;
  let recoveryRequeueCount = 0;

  return {
    get stuckDetectedCount() {
      return stuckDetectedCount;
    },
    get recoveryRequeueCount() {
      return recoveryRequeueCount;
    },
    recordDuplicateClaim: () => undefined,
    recordSkipCompleted: () => undefined,
    recordSkipProcessing: () => undefined,
    recordValidationMismatch: () => undefined,
    recordLowConfidence: () => undefined,
    recordConfidenceDistribution: () => undefined,
    recordStuckProcessingDetected: () => {
      stuckDetectedCount += 1;
    },
    recordRecoveryRequeue: () => {
      recoveryRequeueCount += 1;
    },
  };
}
