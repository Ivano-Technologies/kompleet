import { describe, expect, it, vi } from "vitest";
import { BullMQAdapter } from "@/modules/document-intelligence/infrastructure/queue/bullmq.adapter";
import { DocumentProcessor } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import type { DocumentEntity } from "@/modules/document-intelligence/domain/document.entity";
import type { AuditLogPort } from "@/modules/document-intelligence/application/ports/audit-log.port";
import type { OcrEnginePort } from "@/modules/document-intelligence/application/ports/ocr-engine.port";
import type { WorkerDocumentRepository } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import type { ProcessingMetricsPort } from "@/modules/document-intelligence/infrastructure/metrics/processing-metrics";
import type { ReviewQueuePort } from "@/modules/document-intelligence/infrastructure/review/review-queue.stub";

describe("BullMQAdapter", () => {
  it("enqueues a processing job", async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const adapter = new BullMQAdapter("redis://localhost:6379", { add });

    await adapter.enqueueDocumentProcessing({
      documentId: "doc-1",
      userId: "user-1",
      idempotencyKey: "idem-1",
    });

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(
      "process-document",
      {
        documentId: "doc-1",
        userId: "user-1",
        idempotencyKey: "idem-1",
      },
      expect.objectContaining({
        jobId: "doc-1",
      }),
    );
  });
});

describe("DocumentProcessor", () => {
  it("enforces idempotent skip for completed documents", async () => {
    const repository = createFakeRepository("completed");
    const processor = new DocumentProcessor(
      repository,
      createFakeOcr(),
      createFakeAudit(),
      createFakeMetrics(),
      createFakeReviewQueue(),
    );

    const result = await processor.processJob({
      documentId: "doc-2",
      userId: "user-1",
    });

    expect(result).toBe("skipped");
    expect(repository.transitions).toEqual([]);
  });

  it("transitions queued -> processing -> completed", async () => {
    const repository = createFakeRepository("queued");
    const processor = new DocumentProcessor(
      repository,
      createFakeOcr(),
      createFakeAudit(),
      createFakeMetrics(),
      createFakeReviewQueue(),
    );

    const result = await processor.processJob({
      documentId: "doc-3",
      userId: "user-1",
    });

    expect(result).toBe("processed");
    expect(repository.transitions).toEqual(["processing", "completed"]);
  });

  it("does not persist raw OCR text payload", async () => {
    const repository = createFakeRepository("queued");
    const processor = new DocumentProcessor(
      repository,
      {
        extractStructuredData: async () => ({
          rawText: "Invoice # INV-1",
          boundingBoxes: [{ text: "Invoice", x: 1, y: 1 }],
          invoiceNumber: "INV-1",
          subtotal: 100,
          vatAmount: 7.5,
          totalAmount: 107.5,
          confidenceScore: 92,
        }),
      },
      createFakeAudit(),
      createFakeMetrics(),
      createFakeReviewQueue(),
    );

    await processor.processJob({
      documentId: "doc-4",
      userId: "user-1",
    });

    expect(repository.lastStructuredData).toBeTruthy();
    expect(repository.lastStructuredData).not.toHaveProperty("rawText");
    expect(repository.lastStructuredData).not.toHaveProperty("boundingBoxes");
  });
});

function createFakeOcr(): OcrEnginePort {
  return {
    extractStructuredData: async () => ({
      invoiceNumber: "INV-1",
      vendorName: "ACME",
      issueDate: "2026-01-01",
      currency: "NGN",
      subtotal: 100,
      vatAmount: 7.5,
      totalAmount: 107.5,
    }),
  };
}

function createFakeAudit(): AuditLogPort {
  return {
    record: async () => undefined,
  };
}

function createFakeMetrics(): ProcessingMetricsPort {
  return {
    recordDuplicateClaim: () => undefined,
    recordSkipCompleted: () => undefined,
    recordSkipProcessing: () => undefined,
    recordValidationMismatch: () => undefined,
    recordLowConfidence: () => undefined,
    recordConfidenceDistribution: () => undefined,
    recordStuckProcessingDetected: () => undefined,
    recordRecoveryRequeue: () => undefined,
  };
}

function createFakeReviewQueue(): ReviewQueuePort {
  return {
    enqueueForReview: async () => undefined,
  };
}

function createFakeRepository(initialStatus: DocumentEntity["status"]): {
  transitions: string[];
  lastStructuredData: Record<string, unknown> | null;
} & WorkerDocumentRepository {
  const transitions: string[] = [];
  let lastStructuredData: Record<string, unknown> | null = null;
  let status = initialStatus;

  return {
    transitions,
    get lastStructuredData() {
      return lastStructuredData;
    },
    async findById(documentId, userId) {
      return {
        id: documentId,
        userId,
        documentType: "invoice",
        fileUrl: "s3://doc.pdf",
        status,
        idempotencyKey: "idem-1",
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
      transitions.push("processing");
      return {
        id: documentId,
        userId,
        documentType: "invoice",
        fileUrl: "s3://doc.pdf",
        status,
        idempotencyKey: "idem-1",
        confidenceScore: null,
        structuredData: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async completeProcessing(params) {
      lastStructuredData = params.structuredData;
      status = "completed";
      transitions.push("completed");
    },
    async failProcessing() {
      status = "failed";
      transitions.push("failed");
    },
    async markNeedsReview() {
      status = "failed";
      transitions.push("failed");
    },
  };
}
