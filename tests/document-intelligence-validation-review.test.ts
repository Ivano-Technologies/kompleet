import { describe, expect, it } from "vitest";
import { DocumentProcessor } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import type { AuditLogPort } from "@/modules/document-intelligence/application/ports/audit-log.port";
import type { OcrEnginePort } from "@/modules/document-intelligence/application/ports/ocr-engine.port";
import type { WorkerDocumentRepository } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import type { ProcessingMetricsPort } from "@/modules/document-intelligence/infrastructure/metrics/processing-metrics";
import type { ReviewQueuePort } from "@/modules/document-intelligence/infrastructure/review/review-queue.stub";

describe("DocumentProcessor validation review routing", () => {
  it("routes VAT mismatch documents to needs_review and review queue", async () => {
    const repo = createReviewRepository();
    const metrics = createReviewMetrics();
    const reviewQueue = createReviewQueueSpy();

    const processor = new DocumentProcessor(
      repo,
      createMismatchOcr(),
      createNoopAudit(),
      metrics,
      reviewQueue,
    );

    await processor.processJob({
      documentId: "doc-review",
      userId: "user-1",
    });

    expect(repo.markNeedsReviewCount).toBe(1);
    expect(repo.completeCount).toBe(0);
    expect(reviewQueue.enqueuedCount).toBe(1);
    expect(metrics.validationMismatchCount).toBe(1);
  });
});

function createReviewRepository(): WorkerDocumentRepository & {
  markNeedsReviewCount: number;
  completeCount: number;
} {
  let markNeedsReviewCount = 0;
  let completeCount = 0;

  return {
    get markNeedsReviewCount() {
      return markNeedsReviewCount;
    },
    get completeCount() {
      return completeCount;
    },
    async findById(documentId, userId) {
      return {
        id: documentId,
        userId,
        documentType: "invoice",
        fileUrl: "file://sample.pdf",
        status: "queued",
        idempotencyKey: "idem-review",
        confidenceScore: null,
        structuredData: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async claimQueuedForProcessing(documentId, userId) {
      return {
        id: documentId,
        userId,
        documentType: "invoice",
        fileUrl: "file://sample.pdf",
        status: "processing",
        idempotencyKey: "idem-review",
        confidenceScore: null,
        structuredData: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async completeProcessing() {
      completeCount += 1;
    },
    async failProcessing() {
      return;
    },
    async markNeedsReview() {
      markNeedsReviewCount += 1;
    },
  };
}

function createMismatchOcr(): OcrEnginePort {
  return {
    extractStructuredData: async () => ({
      invoiceNumber: "INV-MISMATCH",
      vendorName: "Mismatch Co",
      issueDate: "2026-03-02",
      currency: "NGN",
      subtotal: 100,
      vatAmount: 7.5,
      totalAmount: 500,
      confidenceScore: 95,
    }),
  };
}

function createNoopAudit(): AuditLogPort {
  return {
    record: async () => undefined,
  };
}

function createReviewMetrics(): ProcessingMetricsPort & {
  validationMismatchCount: number;
} {
  let validationMismatchCount = 0;

  return {
    get validationMismatchCount() {
      return validationMismatchCount;
    },
    recordDuplicateClaim: () => undefined,
    recordSkipCompleted: () => undefined,
    recordSkipProcessing: () => undefined,
    recordValidationMismatch: () => {
      validationMismatchCount += 1;
    },
    recordLowConfidence: () => undefined,
    recordConfidenceDistribution: () => undefined,
    recordStuckProcessingDetected: () => undefined,
    recordRecoveryRequeue: () => undefined,
  };
}

function createReviewQueueSpy(): ReviewQueuePort & { enqueuedCount: number } {
  let enqueuedCount = 0;

  return {
    get enqueuedCount() {
      return enqueuedCount;
    },
    enqueueForReview: async () => {
      enqueuedCount += 1;
    },
  };
}
