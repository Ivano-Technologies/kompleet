import { promises as fs } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AuditLogPort } from "@/modules/document-intelligence/application/ports/audit-log.port";
import type {
  ConfidenceDistributionBucket,
  MetricsPort,
} from "@/modules/document-intelligence/application/ports/metrics.port";
import type { OcrEnginePort } from "@/modules/document-intelligence/application/ports/ocr-engine.port";
import type { DocumentEntity } from "@/modules/document-intelligence/domain/document.entity";
import { estimateCostPerDocument } from "@/modules/document-intelligence/infrastructure/cost/cost-per-document-estimator";
import {
  exportDashboardMetricSummary,
  type DashboardMetricSummary,
} from "@/modules/document-intelligence/infrastructure/metrics/dashboard-metric-summary";
import { WorkerResourceTelemetry } from "@/modules/document-intelligence/infrastructure/metrics/worker-resource-telemetry";
import { DocumentProcessor } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import type { WorkerDocumentRepository } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import type { ReviewQueuePort } from "@/modules/document-intelligence/infrastructure/review/review-queue.stub";
import { clusterVendorTemplates } from "@/modules/document-intelligence/infrastructure/analytics/vendor-template-clustering";

describe("Document load simulation (Phase 5)", () => {
  it("processes 1000+ documents with stable metrics and no duplicate completion", async () => {
    const documentCount = 1200;
    const concurrency = 50;
    const repository = createLoadRepository();
    const telemetry = new WorkerResourceTelemetry(300);
    const metrics = createLoadMetrics();
    const processor = new DocumentProcessor(
      repository,
      createSyntheticOcr(),
      createNoopAudit(),
      metrics,
      createNoopReviewQueue(),
      85,
      telemetry,
    );

    const docs = seedDocuments(repository, documentCount);
    const wrongTenantResult = await processor.processJob({
      documentId: docs[0].id,
      userId: "tenant-not-owner",
    });
    expect(wrongTenantResult).toBe("skipped");

    await runWithConcurrency(
      docs.map((doc) => async () => {
        // Two claims per document simulate duplicate worker races.
        await Promise.all([
          processor.processJob({ documentId: doc.id, userId: doc.userId }),
          processor.processJob({ documentId: doc.id, userId: doc.userId }),
        ]);
      }),
      concurrency,
    );

    expect(repository.completedDocumentIds.size).toBe(documentCount);
    expect(repository.duplicateCompletionCount).toBe(0);

    const samples = telemetry.getSamples();
    const processedSamples = samples.filter((sample) => sample.result === "processed");
    expect(processedSamples.length).toBe(documentCount);

    const queueLatencyMs = average(processedSamples.map((s) => s.queueLatencyMs));
    const ocrDurationMs = average(processedSamples.map((s) => s.ocrDurationMs));
    const extractionDurationMs = average(
      processedSamples.map((s) => s.extractionDurationMs),
    );
    const totalPipelineMs = average(processedSamples.map((s) => s.totalPipelineMs));
    const cpuDurationMs = average(processedSamples.map((s) => s.cpuDurationMs));

    const summary: DashboardMetricSummary = {
      documentCount,
      duplicateRate: round4(
        metrics.duplicateClaimCount /
          (metrics.duplicateClaimCount + processedSamples.length),
      ),
      mismatchRate: round4(metrics.validationMismatchCount / documentCount),
      recoveryRate: 0,
      confidenceDistribution: metrics.confidenceDistribution,
      averageProcessingTimeMs: round2(totalPipelineMs),
    };

    const costReport = estimateCostPerDocument({
      averageOcrDurationMs: ocrDurationMs,
      averageCpuDurationMs: cpuDurationMs,
      averagePipelineDurationMs: totalPipelineMs,
      documentCount,
    });

    const templateClusters = clusterVendorTemplates(
      docs.map((doc, index) => ({
        vendorName: `vendor-${index % 12}`,
        rawText: buildRawText(index),
      })),
    );

    expect(templateClusters.length).toBeGreaterThan(8);

    const outputPath = join(
      process.cwd(),
      "tests",
      "load",
      "output",
      "document-load-summary.json",
    );
    await exportDashboardMetricSummary(outputPath, summary);
    await fs.writeFile(
      join(process.cwd(), "tests", "load", "output", "document-cost-report.json"),
      `${JSON.stringify(
        {
          ...costReport,
          averageQueueLatencyMs: round2(queueLatencyMs),
          averageExtractionDurationMs: round2(extractionDurationMs),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const summaryFile = JSON.parse(await fs.readFile(outputPath, "utf8")) as {
      averageProcessingTimeMs: number;
      duplicateRate: number;
    };

    expect(summaryFile.duplicateRate).toBeLessThanOrEqual(1);
    expect(summaryFile.averageProcessingTimeMs).toBeGreaterThanOrEqual(0);
    expect(queueLatencyMs).toBeGreaterThanOrEqual(0);
    expect(extractionDurationMs).toBeGreaterThanOrEqual(0);
    expect(totalPipelineMs).toBeGreaterThanOrEqual(0);
  });
});

function createLoadRepository(): WorkerDocumentRepository & {
  seed(document: DocumentEntity): void;
  completedDocumentIds: Set<string>;
  duplicateCompletionCount: number;
} {
  const documents = new Map<string, DocumentEntity>();
  const completedDocumentIds = new Set<string>();
  const processingAttemptCount = new Map<string, number>();
  let duplicateCompletionCount = 0;

  return {
    seed(document) {
      documents.set(document.id, document);
      processingAttemptCount.set(document.id, 0);
    },
    get completedDocumentIds() {
      return completedDocumentIds;
    },
    get duplicateCompletionCount() {
      return duplicateCompletionCount;
    },
    async findById(documentId, userId) {
      const document = documents.get(documentId);
      if (!document || document.userId !== userId) {
        return null;
      }
      return document;
    },
    async claimQueuedForProcessing(documentId, userId) {
      const document = documents.get(documentId);
      if (!document || document.userId !== userId || document.status !== "queued") {
        return null;
      }
      const attempts = (processingAttemptCount.get(documentId) ?? 0) + 1;
      processingAttemptCount.set(documentId, attempts);
      if (attempts > 3) {
        documents.set(documentId, {
          ...document,
          status: "failed",
          errorMessage: "max_processing_attempts_exceeded",
          updatedAt: new Date(),
        });
        return null;
      }

      const claimed: DocumentEntity = {
        ...document,
        status: "processing",
        updatedAt: new Date(),
      };
      documents.set(documentId, claimed);
      return claimed;
    },
    async completeProcessing(params) {
      const existing = documents.get(params.documentId);
      if (!existing || existing.status !== "processing") {
        return;
      }
      if (completedDocumentIds.has(params.documentId)) {
        duplicateCompletionCount += 1;
      }
      completedDocumentIds.add(params.documentId);
      documents.set(params.documentId, {
        ...existing,
        status: "completed",
        confidenceScore: params.confidenceScore,
        structuredData: params.structuredData,
        errorMessage: null,
        updatedAt: new Date(),
      });
    },
    async failProcessing(params) {
      const existing = documents.get(params.documentId);
      if (!existing) return;
      documents.set(params.documentId, {
        ...existing,
        status: "failed",
        errorMessage: params.errorMessage,
        updatedAt: new Date(),
      });
    },
    async markNeedsReview(params) {
      const existing = documents.get(params.documentId);
      if (!existing) return;
      documents.set(params.documentId, {
        ...existing,
        status: "failed",
        errorMessage: params.reason,
        updatedAt: new Date(),
      });
    },
  };
}

function seedDocuments(
  repository: ReturnType<typeof createLoadRepository>,
  count: number,
): DocumentEntity[] {
  const now = Date.now();
  const docs: DocumentEntity[] = [];

  for (let index = 0; index < count; index += 1) {
    const userId = `tenant-${index % 40}`;
    const document: DocumentEntity = {
      id: `doc-load-${index}`,
      userId,
      documentType: "invoice",
      fileUrl: `memory://invoice-${index}.txt`,
      status: "queued",
      idempotencyKey: `idem-${index}`,
      confidenceScore: null,
      structuredData: null,
      errorMessage: null,
      createdAt: new Date(now - (index % 20) * 25),
      updatedAt: new Date(now - (index % 20) * 25),
    };
    repository.seed(document);
    docs.push(document);
  }

  return docs;
}

function createSyntheticOcr(): OcrEnginePort {
  return {
    async extractStructuredData(params) {
      const index = Number(params.fileUrl.match(/(\d+)/)?.[1] ?? "0");
      return {
        rawText: buildRawText(index),
        confidenceScore: 93 + (index % 5),
        textHash: `text-hash-${index}`,
        pageCount: 1,
        fileSizeBytes: 4096 + index,
      };
    },
  };
}

function buildRawText(index: number): string {
  return [
    `Vendor ${index % 12} Limited`,
    `Invoice No: INV-${String(index).padStart(6, "0")}`,
    `Date: 2026-03-${String((index % 28) + 1).padStart(2, "0")}`,
    "Currency: NGN",
    "Subtotal: 1000.00",
    "VAT: 75.00",
    "Total: 1075.00",
  ].join("\n");
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

function createLoadMetrics(): MetricsPort & {
  duplicateClaimCount: number;
  validationMismatchCount: number;
  confidenceDistribution: Record<ConfidenceDistributionBucket, number>;
} {
  let duplicateClaimCount = 0;
  let validationMismatchCount = 0;
  const confidenceDistribution: Record<ConfidenceDistributionBucket, number> = {
    very_low: 0,
    low: 0,
    medium: 0,
    high: 0,
    very_high: 0,
  };

  return {
    get duplicateClaimCount() {
      return duplicateClaimCount;
    },
    get validationMismatchCount() {
      return validationMismatchCount;
    },
    get confidenceDistribution() {
      return confidenceDistribution;
    },
    recordDuplicateClaim: () => {
      duplicateClaimCount += 1;
    },
    recordSkipCompleted: () => undefined,
    recordSkipProcessing: () => undefined,
    recordValidationMismatch: () => {
      validationMismatchCount += 1;
    },
    recordLowConfidence: () => undefined,
    recordConfidenceDistribution: (_documentId, bucket) => {
      confidenceDistribution[bucket] += 1;
    },
    recordStuckProcessingDetected: () => undefined,
    recordRecoveryRequeue: () => undefined,
  };
}

async function runWithConcurrency(
  tasks: Array<() => Promise<void>>,
  concurrency: number,
): Promise<void> {
  const executing = new Set<Promise<void>>();

  for (const task of tasks) {
    const run = task().finally(() => {
      executing.delete(run);
    });
    executing.add(run);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
