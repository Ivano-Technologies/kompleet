import type { ConvexHttpClient } from "convex/browser";
import { api } from "@/lib/convex/http";
import type {
  DocumentEntity,
  DocumentStatus,
  DocumentType,
} from "../../domain/document.entity";
import type { DocumentRepositoryPort } from "../../application/ports/document-repository.port";

export interface DocumentRecord {
  id: string;
  user_id: string;
  status: string;
  document_type: string | null;
  file_url: string | null;
  file_name: string | null;
  content_type: string | null;
  idempotency_key: string | null;
  confidence_score: number | null;
  structured_data: Record<string, unknown> | null;
  error_message: string | null;
  processing_attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConvexDocumentRepositoryOptions {
  admin?: boolean;
  workerToken?: string;
}

function toEntity(row: DocumentRecord): DocumentEntity {
  return {
    id: row.id,
    userId: row.user_id,
    documentType: (row.document_type as DocumentType | null) ?? "other",
    fileUrl: row.file_url ?? "",
    status: row.status as DocumentStatus,
    idempotencyKey: row.idempotency_key ?? "",
    confidenceScore: row.confidence_score,
    structuredData: row.structured_data,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ConvexDocumentRepository implements DocumentRepositoryPort {
  private readonly maxProcessingAttempts: number;

  constructor(
    private readonly convex: ConvexHttpClient,
    private readonly options: ConvexDocumentRepositoryOptions = {},
  ) {
    this.maxProcessingAttempts = parsePositiveInt(
      process.env.MAX_PROCESSING_ATTEMPTS,
      3,
    );
  }

  private workerToken(): string {
    const token = this.options.workerToken;
    if (!token) {
      throw new Error("DOCUMENT_WORKER_TOKEN is required for worker document calls.");
    }
    return token;
  }

  async create(document: DocumentEntity): Promise<void> {
    if (this.options.admin) {
      throw new Error(
        "Document create is user-scoped; workers must not insert uploads.",
      );
    }
    await this.convex.mutation(api.documents.createMine, {
      externalId: document.id,
      idempotencyKey: document.idempotencyKey,
      status: document.status,
      documentType: document.documentType,
      fileUrl: document.fileUrl,
      payload: {
        documentType: document.documentType,
        fileUrl: document.fileUrl,
        confidenceScore: document.confidenceScore,
        structuredData: document.structuredData,
        errorMessage: document.errorMessage,
      },
    });
  }

  async findById(id: string, userId: string): Promise<DocumentEntity | null> {
    const row = this.options.admin
      ? await this.convex.query(api.documents.workerGetByExternalId, {
          workerToken: this.workerToken(),
          externalId: id,
          userExternalId: userId,
        })
      : await this.convex.query(api.documents.getMine, { externalId: id });
    return row ? toEntity(row) : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    userId: string,
  ): Promise<DocumentEntity | null> {
    const row = this.options.admin
      ? await this.convex.query(api.documents.workerGetByIdempotencyKey, {
          workerToken: this.workerToken(),
          idempotencyKey,
          userExternalId: userId,
        })
      : await this.convex.query(api.documents.getMineByIdempotencyKey, {
          idempotencyKey,
        });
    return row ? toEntity(row) : null;
  }

  async updateStatus(params: {
    documentId: string;
    userId: string;
    status: DocumentStatus;
    confidenceScore?: number | null;
    structuredData?: Record<string, unknown> | null;
    errorMessage?: string | null;
  }): Promise<void> {
    if (this.options.admin) {
      await this.convex.mutation(api.documents.workerUpdateStatus, {
        workerToken: this.workerToken(),
        externalId: params.documentId,
        userExternalId: params.userId,
        status: params.status,
        ...(params.confidenceScore !== undefined
          ? { confidenceScore: params.confidenceScore }
          : {}),
        ...(params.structuredData !== undefined
          ? { structuredData: params.structuredData }
          : {}),
        ...(params.errorMessage !== undefined
          ? { errorMessage: params.errorMessage }
          : {}),
      });
      return;
    }
    await this.convex.mutation(api.documents.updateMineStatus, {
      externalId: params.documentId,
      status: params.status,
      ...(params.confidenceScore !== undefined
        ? { confidenceScore: params.confidenceScore }
        : {}),
      ...(params.structuredData !== undefined
        ? { structuredData: params.structuredData }
        : {}),
      ...(params.errorMessage !== undefined
        ? { errorMessage: params.errorMessage }
        : {}),
    });
  }

  async claimQueuedForProcessing(
    documentId: string,
    userId: string,
  ): Promise<DocumentEntity | null> {
    const row = await this.convex.mutation(api.documents.workerClaimQueued, {
      workerToken: this.workerToken(),
      externalId: documentId,
      userExternalId: userId,
      maxProcessingAttempts: this.maxProcessingAttempts,
    });
    return row ? toEntity(row) : null;
  }

  async completeProcessing(params: {
    documentId: string;
    userId: string;
    structuredData: Record<string, unknown>;
    confidenceScore: number;
  }): Promise<void> {
    await this.convex.mutation(api.documents.workerCompleteProcessing, {
      workerToken: this.workerToken(),
      externalId: params.documentId,
      userExternalId: params.userId,
      structuredData: params.structuredData,
      confidenceScore: params.confidenceScore,
    });
  }

  async failProcessing(params: {
    documentId: string;
    userId: string;
    errorMessage: string;
  }): Promise<void> {
    await this.convex.mutation(api.documents.workerFailProcessing, {
      workerToken: this.workerToken(),
      externalId: params.documentId,
      userExternalId: params.userId,
      errorMessage: params.errorMessage,
    });
  }

  async markNeedsReview(params: {
    documentId: string;
    userId: string;
    reason: string;
  }): Promise<void> {
    await this.convex.mutation(api.documents.workerMarkNeedsReview, {
      workerToken: this.workerToken(),
      externalId: params.documentId,
      userExternalId: params.userId,
      reason: params.reason,
    });
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
    const rows = await this.convex.query(api.documents.workerFindStaleProcessing, {
      workerToken: this.workerToken(),
      olderThanMinutes: params.olderThanMinutes,
      limit: params.limit,
      now: Date.now(),
    });
    return rows.map((row) => ({
      documentId: row.documentId,
      userId: row.userId,
      idempotencyKey: row.idempotencyKey,
      processingStartedAt:
        row.processingStartedAt === null
          ? null
          : new Date(row.processingStartedAt),
    }));
  }

  async requeueStaleProcessingDocument(params: {
    documentId: string;
    userId: string;
  }): Promise<boolean> {
    return await this.convex.mutation(api.documents.workerRequeueStale, {
      workerToken: this.workerToken(),
      externalId: params.documentId,
      userExternalId: params.userId,
    });
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
