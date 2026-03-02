import type {
  DocumentEntity,
  DocumentStatus,
} from "../../domain/document.entity";
import type { DocumentRepositoryPort } from "../../application/ports/document-repository.port";
import { logger } from "@/lib/logger";

export class InMemoryDocumentRepository implements DocumentRepositoryPort {
  private readonly documents = new Map<string, DocumentEntity>();
  private readonly processingStartedAt = new Map<string, Date | null>();
  private readonly processingAttemptCount = new Map<string, number>();
  private readonly maxProcessingAttempts = parsePositiveInt(
    process.env.MAX_PROCESSING_ATTEMPTS,
    3,
  );

  async create(document: DocumentEntity): Promise<void> {
    this.documents.set(document.id, document);
    this.processingStartedAt.set(document.id, null);
    this.processingAttemptCount.set(document.id, 0);
  }

  async findById(id: string, userId: string): Promise<DocumentEntity | null> {
    const document = this.documents.get(id);
    if (!document || document.userId !== userId) {
      return null;
    }

    return document;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    userId: string,
  ): Promise<DocumentEntity | null> {
    for (const document of this.documents.values()) {
      if (
        document.idempotencyKey === idempotencyKey &&
        document.userId === userId
      ) {
        return document;
      }
    }

    return null;
  }

  async updateStatus(params: {
    documentId: string;
    userId: string;
    status: DocumentStatus;
    confidenceScore?: number | null;
    structuredData?: Record<string, unknown> | null;
    errorMessage?: string | null;
  }): Promise<void> {
    const existing = await this.findById(params.documentId, params.userId);
    if (!existing) {
      return;
    }

    this.documents.set(params.documentId, {
      ...existing,
      status: params.status,
      confidenceScore:
        params.confidenceScore !== undefined
          ? params.confidenceScore
          : existing.confidenceScore,
      structuredData:
        params.structuredData !== undefined
          ? params.structuredData
          : existing.structuredData,
      errorMessage:
        params.errorMessage !== undefined
          ? params.errorMessage
          : existing.errorMessage,
      updatedAt: new Date(),
    });
  }

  async claimQueuedForProcessing(
    documentId: string,
    userId: string,
  ): Promise<DocumentEntity | null> {
    const existing = await this.findById(documentId, userId);
    if (!existing || existing.status !== "queued") {
      return null;
    }
    const attempts = this.processingAttemptCount.get(documentId) ?? 0;
    const nextAttemptCount = attempts + 1;
    this.processingAttemptCount.set(documentId, nextAttemptCount);
    if (nextAttemptCount > this.maxProcessingAttempts) {
      logger.warn("Document exceeded maximum processing attempts", {
        operation: "worker.document.metrics.max_attempts_exceeded",
        documentId,
        userId,
        maxProcessingAttempts: this.maxProcessingAttempts,
        processingAttemptCount: nextAttemptCount,
      });
      this.documents.set(documentId, {
        ...existing,
        status: "failed",
        errorMessage: "max_processing_attempts_exceeded",
        updatedAt: new Date(),
      });
      this.processingStartedAt.set(documentId, null);
      return null;
    }

    const claimed: DocumentEntity = {
      ...existing,
      status: "processing",
      updatedAt: new Date(),
    };
    this.documents.set(documentId, claimed);
    this.processingStartedAt.set(documentId, new Date());
    return claimed;
  }

  async completeProcessing(params: {
    documentId: string;
    userId: string;
    structuredData: Record<string, unknown>;
    confidenceScore: number;
  }): Promise<void> {
    const existing = await this.findById(params.documentId, params.userId);
    if (!existing || existing.status !== "processing") {
      return;
    }

    this.documents.set(params.documentId, {
      ...existing,
      status: "completed",
      structuredData: params.structuredData,
      confidenceScore: params.confidenceScore,
      errorMessage: null,
      updatedAt: new Date(),
    });
    this.processingStartedAt.set(params.documentId, null);
  }

  async failProcessing(params: {
    documentId: string;
    userId: string;
    errorMessage: string;
  }): Promise<void> {
    const existing = await this.findById(params.documentId, params.userId);
    if (!existing || existing.status !== "processing") {
      return;
    }

    this.documents.set(params.documentId, {
      ...existing,
      status: "failed",
      errorMessage: params.errorMessage,
      updatedAt: new Date(),
    });
    this.processingStartedAt.set(params.documentId, null);
  }

  async markNeedsReview(params: {
    documentId: string;
    userId: string;
    reason: string;
  }): Promise<void> {
    const existing = await this.findById(params.documentId, params.userId);
    if (!existing || existing.status !== "processing") {
      return;
    }

    this.documents.set(params.documentId, {
      ...existing,
      status: "failed",
      errorMessage: `needs_review:${params.reason}`,
      updatedAt: new Date(),
    });
    this.processingStartedAt.set(params.documentId, null);
  }

  async findStaleProcessingDocuments(params: {
    olderThanMinutes: number;
    limit: number;
  }): Promise<
    Array<{
      documentId: string;
      userId: string;
      idempotencyKey: string;
      processingStartedAt: Date | null;
    }>
  > {
    const threshold = Date.now() - params.olderThanMinutes * 60 * 1000;
    const stale = [];

    for (const doc of this.documents.values()) {
      if (doc.status !== "processing") continue;
      const startedAt = this.processingStartedAt.get(doc.id) ?? null;
      if (!startedAt || startedAt.getTime() >= threshold) continue;

      stale.push({
        documentId: doc.id,
        userId: doc.userId,
        idempotencyKey: doc.idempotencyKey,
        processingStartedAt: startedAt,
      });
      if (stale.length >= params.limit) {
        break;
      }
    }

    return stale;
  }

  async requeueStaleProcessingDocument(params: {
    documentId: string;
    userId: string;
  }): Promise<boolean> {
    const existing = await this.findById(params.documentId, params.userId);
    if (!existing || existing.status !== "processing") {
      return false;
    }

    this.documents.set(params.documentId, {
      ...existing,
      status: "queued",
      updatedAt: new Date(),
    });
    this.processingStartedAt.set(params.documentId, null);
    return true;
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}
