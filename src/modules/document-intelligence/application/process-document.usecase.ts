import { randomUUID } from "node:crypto";
import { isConvexAuthError } from "@/lib/convex/errors";
import { logger } from "@/lib/logger";
import type { AuditLogPort } from "./ports/audit-log.port";
import type { DocumentRepositoryPort } from "./ports/document-repository.port";
import type { QueuePort } from "./ports/queue.port";
import {
  createQueuedDocument,
  type DocumentEntity,
  type DocumentType,
} from "../domain/document.entity";

export class DocumentPersistError extends Error {
  constructor(message = "Failed to persist document") {
    super(message);
    this.name = "DocumentPersistError";
  }
}

export interface ProcessDocumentInput {
  userId: string;
  documentType: DocumentType;
  fileUrl: string;
  idempotencyKey: string;
}

export interface ProcessDocumentOutput {
  documentId: string;
  status: "queued";
}

export class ProcessDocumentUseCase {
  constructor(
    private readonly repository: DocumentRepositoryPort,
    private readonly queue: QueuePort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(input: ProcessDocumentInput): Promise<ProcessDocumentOutput> {
    let existing: DocumentEntity | null;
    try {
      existing = await this.repository.findByIdempotencyKey(
        input.idempotencyKey,
        input.userId,
      );
    } catch (error) {
      if (isConvexAuthError(error)) {
        throw error;
      }
      logger.error("document idempotency lookup failed", {
        operation: "document.persist",
        error: error instanceof Error ? error.message : "unknown",
      });
      throw new DocumentPersistError("Failed to persist document");
    }

    if (existing) {
      return {
        documentId: existing.id,
        status: "queued",
      };
    }

    const document = createQueuedDocument({
      id: randomUUID(),
      userId: input.userId,
      documentType: input.documentType,
      fileUrl: input.fileUrl,
      idempotencyKey: input.idempotencyKey,
    });

    let persisted: DocumentEntity;
    try {
      persisted = await this.repository.create(document);
    } catch (error) {
      if (isConvexAuthError(error)) {
        throw error;
      }
      logger.error("document createMine failed", {
        operation: "document.persist",
        error: error instanceof Error ? error.message : "unknown",
      });
      throw new DocumentPersistError("Failed to persist document");
    }

    await this.queue.enqueueDocumentProcessing({
      documentId: persisted.id,
      userId: persisted.userId,
      idempotencyKey: persisted.idempotencyKey,
    });

    try {
      await this.auditLog.record({
        userId: persisted.userId,
        documentId: persisted.id,
        action: "document_queued",
        metadata: {
          documentType: persisted.documentType,
        },
      });
    } catch (error) {
      logger.warn("document audit append failed after persist", {
        operation: "document.audit",
        documentId: persisted.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }

    return {
      documentId: persisted.id,
      status: "queued",
    };
  }
}
