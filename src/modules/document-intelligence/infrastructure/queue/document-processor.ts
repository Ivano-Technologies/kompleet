import { logger } from "@/lib/logger";
import { ValidateDocumentUseCase } from "../../application/validate-document.usecase";
import type { AuditLogPort } from "../../application/ports/audit-log.port";
import type { MetricsPort } from "../../application/ports/metrics.port";
import { extractInvoiceStructuredOutput } from "../../application/extraction";
import type { OcrEnginePort } from "../../application/ports/ocr-engine.port";
import type { DocumentEntity } from "../../domain/document.entity";
import {
  WorkerResourceTelemetry,
  type WorkerResourceSample,
} from "../metrics/worker-resource-telemetry";
import type { ReviewQueuePort } from "../review/review-queue.stub";

export interface WorkerDocumentRepository {
  findById(documentId: string, userId: string): Promise<DocumentEntity | null>;
  claimQueuedForProcessing(
    documentId: string,
    userId: string,
  ): Promise<DocumentEntity | null>;
  completeProcessing(params: {
    documentId: string;
    userId: string;
    structuredData: Record<string, unknown>;
    confidenceScore: number;
  }): Promise<void>;
  failProcessing(params: {
    documentId: string;
    userId: string;
    errorMessage: string;
  }): Promise<void>;
  markNeedsReview(params: {
    documentId: string;
    userId: string;
    reason: string;
  }): Promise<void>;
}

export class DocumentProcessor {
  private readonly validateDocumentUseCase = new ValidateDocumentUseCase();
  private readonly resourceTelemetry: WorkerResourceTelemetry;

  constructor(
    private readonly repository: WorkerDocumentRepository,
    private readonly ocrEngine: OcrEnginePort,
    private readonly auditLog: AuditLogPort,
    private readonly metrics: MetricsPort,
    private readonly reviewQueue: ReviewQueuePort,
    private readonly minimumConfidenceForAutoCompletion = 85,
    resourceTelemetry = new WorkerResourceTelemetry(),
  ) {
    this.resourceTelemetry = resourceTelemetry;
  }

  async processJob(params: {
    documentId: string;
    userId: string;
  }): Promise<"processed" | "skipped"> {
    const runStartedAt = Date.now();
    const cpuStartedAt = process.hrtime.bigint();
    const memoryStartedRss = process.memoryUsage().rss;
    let queueLatencyMs = 0;
    let ocrDurationMs = 0;
    let extractionDurationMs = 0;
    let result: "processed" | "skipped" = "skipped";
    const existing = await this.repository.findById(
      params.documentId,
      params.userId,
    );

    if (!existing) {
      logger.warn("Skipping missing document in worker", {
        operation: "worker.document.process",
        documentId: params.documentId,
        userId: params.userId,
      });
      this.recordResourceTelemetry({
        documentId: params.documentId,
        result,
        queueLatencyMs,
        ocrDurationMs,
        extractionDurationMs,
        runStartedAt,
        cpuStartedAt,
        memoryStartedRss,
      });
      return result;
    }
    queueLatencyMs = Math.max(0, Date.now() - existing.createdAt.getTime());

    if (existing.status === "completed") {
      this.metrics.recordSkipCompleted(existing.id);
      this.recordResourceTelemetry({
        documentId: existing.id,
        result,
        queueLatencyMs,
        ocrDurationMs,
        extractionDurationMs,
        runStartedAt,
        cpuStartedAt,
        memoryStartedRss,
      });
      return result;
    }

    if (existing.status === "processing") {
      this.metrics.recordSkipProcessing(existing.id);
      this.recordResourceTelemetry({
        documentId: existing.id,
        result,
        queueLatencyMs,
        ocrDurationMs,
        extractionDurationMs,
        runStartedAt,
        cpuStartedAt,
        memoryStartedRss,
      });
      return result;
    }

    const claimed = await this.repository.claimQueuedForProcessing(
      params.documentId,
      params.userId,
    );

    if (!claimed) {
      this.metrics.recordDuplicateClaim(params.documentId);
      this.recordResourceTelemetry({
        documentId: params.documentId,
        result,
        queueLatencyMs,
        ocrDurationMs,
        extractionDurationMs,
        runStartedAt,
        cpuStartedAt,
        memoryStartedRss,
      });
      return result;
    }

    try {
      const ocrStartedAt = Date.now();
      const ocrResult = await this.ocrEngine.extractStructuredData({
        fileUrl: claimed.fileUrl,
        documentType: claimed.documentType,
      });
      ocrDurationMs = Date.now() - ocrStartedAt;
      const ocrConfidence = safeNumber(ocrResult.confidenceScore, 0);
      if (ocrDurationMs > 5_000) {
        logger.warn("OCR processing exceeded recommended threshold", {
          operation: "worker.document.ocr",
          documentId: claimed.id,
          durationMs: ocrDurationMs,
        });
      }

      const extractionStartedAt = Date.now();
      const extraction = extractInvoiceStructuredOutput(ocrResult);
      extractionDurationMs = Date.now() - extractionStartedAt;
      const validationStartedAt = Date.now();
      const validation = this.validateDocumentUseCase.executeInvoiceValidation(
        extraction.invoice,
      );
      const validationDurationMs = Date.now() - validationStartedAt;
      const confidenceScore = Math.max(
        validation.confidenceScore,
        extraction.confidenceScore,
        ocrConfidence,
      );
      this.metrics.recordConfidenceDistribution(
        claimed.id,
        extraction.confidenceBucket,
        confidenceScore,
      );

      const validationMismatch = validation.errors.length > 0;
      const lowConfidence =
        confidenceScore < this.minimumConfidenceForAutoCompletion;

      const deterministicOutput = {
        ...extraction.structuredData,
        __validationErrors: validation.errors,
      };

      if (validationMismatch || lowConfidence) {
        if (validationMismatch) {
          this.metrics.recordValidationMismatch(claimed.id);
        }
        if (lowConfidence) {
          this.metrics.recordLowConfidence(claimed.id, confidenceScore);
        }

        const reason = validationMismatch
          ? "validation_mismatch"
          : "low_confidence";

        await this.repository.markNeedsReview({
          documentId: claimed.id,
          userId: claimed.userId,
          reason,
        });

        await this.reviewQueue.enqueueForReview({
          documentId: claimed.id,
          userId: claimed.userId,
          reason,
        });

        await this.auditLog.record({
          userId: claimed.userId,
          documentId: claimed.id,
          action: "document_needs_review",
          metadata: {
            reason,
            confidenceScore,
            validationErrorCount: validation.errors.length,
            ocrDurationMs,
            validationDurationMs,
          },
        });

        result = "processed";
        this.recordResourceTelemetry({
          documentId: claimed.id,
          result,
          queueLatencyMs,
          ocrDurationMs,
          extractionDurationMs,
          runStartedAt,
          cpuStartedAt,
          memoryStartedRss,
        });
        return result;
      }

      await this.repository.completeProcessing({
        documentId: claimed.id,
        userId: claimed.userId,
        structuredData: deterministicOutput,
        confidenceScore,
      });

      await this.auditLog.record({
        userId: claimed.userId,
        documentId: claimed.id,
        action: "document_processed",
        metadata: {
          ocrDurationMs,
          validationDurationMs,
          confidenceScore,
          validationErrorCount: validation.errors.length,
        },
      });

      result = "processed";
      this.recordResourceTelemetry({
        documentId: claimed.id,
        result,
        queueLatencyMs,
        ocrDurationMs,
        extractionDurationMs,
        runStartedAt,
        cpuStartedAt,
        memoryStartedRss,
      });
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown worker error";
      await this.repository.failProcessing({
        documentId: claimed.id,
        userId: claimed.userId,
        errorMessage: message,
      });

      await this.auditLog.record({
        userId: claimed.userId,
        documentId: claimed.id,
        action: "document_processing_failed",
        metadata: { reason: message },
      });

      this.recordResourceTelemetry({
        documentId: claimed.id,
        result,
        queueLatencyMs,
        ocrDurationMs,
        extractionDurationMs,
        runStartedAt,
        cpuStartedAt,
        memoryStartedRss,
      });
      throw error;
    }
  }

  private recordResourceTelemetry(params: {
    documentId: string;
    result: "processed" | "skipped";
    queueLatencyMs: number;
    ocrDurationMs: number;
    extractionDurationMs: number;
    runStartedAt: number;
    cpuStartedAt: bigint;
    memoryStartedRss: number;
  }): void {
    const totalPipelineMs = Math.max(0, Date.now() - params.runStartedAt);
    const cpuDurationMs =
      Number(process.hrtime.bigint() - params.cpuStartedAt) / 1_000_000;
    const memoryRssBytes = Math.max(0, process.memoryUsage().rss - params.memoryStartedRss);

    const sample: WorkerResourceSample = {
      documentId: params.documentId,
      result: params.result,
      queueLatencyMs: params.queueLatencyMs,
      ocrDurationMs: params.ocrDurationMs,
      extractionDurationMs: params.extractionDurationMs,
      totalPipelineMs: Math.round(totalPipelineMs * 100) / 100,
      cpuDurationMs: Math.round(cpuDurationMs * 100) / 100,
      memoryRssBytes,
    };
    this.resourceTelemetry.record(sample);
  }
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
