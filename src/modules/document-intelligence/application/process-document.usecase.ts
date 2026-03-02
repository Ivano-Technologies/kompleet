import { randomUUID } from "node:crypto";
import type { AuditLogPort } from "./ports/audit-log.port";
import type { DocumentRepositoryPort } from "./ports/document-repository.port";
import type { QueuePort } from "./ports/queue.port";
import { createQueuedDocument, type DocumentType } from "../domain/document.entity";

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
    const existing = await this.repository.findByIdempotencyKey(
      input.idempotencyKey,
      input.userId,
    );

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

    await this.repository.create(document);
    await this.queue.enqueueDocumentProcessing({
      documentId: document.id,
      userId: document.userId,
      idempotencyKey: document.idempotencyKey,
    });

    await this.auditLog.record({
      userId: document.userId,
      documentId: document.id,
      action: "document_queued",
      metadata: {
        documentType: document.documentType,
      },
    });

    return {
      documentId: document.id,
      status: "queued",
    };
  }
}
