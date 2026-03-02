import type {
  DocumentEntity,
  DocumentStatus,
} from "../../domain/document.entity";

export interface DocumentRepositoryPort {
  create(document: DocumentEntity): Promise<void>;
  findById(id: string, userId: string): Promise<DocumentEntity | null>;
  findByIdempotencyKey(
    idempotencyKey: string,
    userId: string,
  ): Promise<DocumentEntity | null>;
  updateStatus(params: {
    documentId: string;
    userId: string;
    status: DocumentStatus;
    confidenceScore?: number | null;
    structuredData?: Record<string, unknown> | null;
    errorMessage?: string | null;
  }): Promise<void>;
}
