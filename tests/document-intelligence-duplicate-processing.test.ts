import { describe, expect, it } from "vitest";
import { DocumentProcessor } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import type { AuditLogPort } from "@/modules/document-intelligence/application/ports/audit-log.port";
import type { OcrEnginePort } from "@/modules/document-intelligence/application/ports/ocr-engine.port";
import type { WorkerDocumentRepository } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import type { ProcessingMetricsPort } from "@/modules/document-intelligence/infrastructure/metrics/processing-metrics";
import type { ReviewQueuePort } from "@/modules/document-intelligence/infrastructure/review/review-queue.stub";

describe("DocumentProcessor duplicate detection", () => {
  it("processes only once when two workers race for same document", async () => {
    const repository = createRaceRepository();
    const metrics = createMetricsCollector();

    const processor = new DocumentProcessor(
      repository,
      createFixedOcr(),
      createNoopAudit(),
      metrics,
      createNoopReviewQueue(),
    );

    const [first, second] = await Promise.all([
      processor.processJob({ documentId: "doc-race", userId: "user-1" }),
      processor.processJob({ documentId: "doc-race", userId: "user-1" }),
    ]);

    expect([first, second].sort()).toEqual(["processed", "skipped"]);
    expect(repository.completeCount).toBe(1);
    expect(metrics.duplicateClaimCount).toBe(1);
  });
});

function createRaceRepository(): WorkerDocumentRepository & { completeCount: number } {
  let status: "queued" | "processing" | "completed" = "queued";
  let completeCount = 0;

  return {
    get completeCount() {
      return completeCount;
    },
    async findById(documentId, userId) {
      return {
        id: documentId,
        userId,
        documentType: "invoice",
        fileUrl: "file://sample.pdf",
        status,
        idempotencyKey: "idem-race",
        confidenceScore: null,
        structuredData: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async claimQueuedForProcessing(documentId, userId) {
      if (status !== "queued") {
        return null;
      }
      status = "processing";
      return {
        id: documentId,
        userId,
        documentType: "invoice",
        fileUrl: "file://sample.pdf",
        status,
        idempotencyKey: "idem-race",
        confidenceScore: null,
        structuredData: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async completeProcessing() {
      status = "completed";
      completeCount += 1;
    },
    async failProcessing() {
      status = "completed";
    },
    async markNeedsReview() {
      status = "completed";
    },
  };
}

function createMetricsCollector(): ProcessingMetricsPort & { duplicateClaimCount: number } {
  let duplicateClaimCount = 0;

  return {
    get duplicateClaimCount() {
      return duplicateClaimCount;
    },
    recordDuplicateClaim: () => {
      duplicateClaimCount += 1;
    },
    recordSkipCompleted: () => undefined,
    recordSkipProcessing: () => undefined,
    recordValidationMismatch: () => undefined,
    recordLowConfidence: () => undefined,
    recordConfidenceDistribution: () => undefined,
    recordStuckProcessingDetected: () => undefined,
    recordRecoveryRequeue: () => undefined,
  };
}

function createFixedOcr(): OcrEnginePort {
  return {
    extractStructuredData: async () => ({
      invoiceNumber: "INV-RACE",
      vendorName: "Race Test",
      issueDate: "2026-03-02",
      currency: "NGN",
      subtotal: 100,
      vatAmount: 7.5,
      totalAmount: 107.5,
      confidenceScore: 95,
    }),
  };
}

function createNoopAudit(): AuditLogPort {
  return {
    record: async () => undefined,
  };
}

function createNoopReviewQueue(): ReviewQueuePort {
  return {
    enqueueForReview: async () => undefined,
  };
}
