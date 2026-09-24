import { randomUUID } from "node:crypto";
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

    try {
      await this.repository.create(document);
    } catch (error) {
      logger.error("document createMine failed", {
        operation: "document.persist",
        error: error instanceof Error ? error.message : "unknown",
      });
      throw new DocumentPersistError("Failed to persist document");
    }

    await this.queue.enqueueDocumentProcessing({
      documentId: document.id,
      userId: document.userId,
      idempotencyKey: document.idempotencyKey,
    });

    try {
      await this.auditLog.record({
        userId: document.userId,
        documentId: document.id,
        action: "document_queued",
        metadata: {
          documentType: document.documentType,
        },
      });
    } catch (error) {
      logger.warn("document audit append failed after persist", {
        operation: "document.audit",
        documentId: document.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }

    return {
      documentId: document.id,
      status: "queued",
    };
  }
}
