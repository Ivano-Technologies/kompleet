import type {
  DocumentEntity,
  DocumentStatus,
} from "../../domain/document.entity";

export interface DocumentRepositoryPort {
  /** Persist the document and return the stored row (Convex may assign id). */
  create(document: DocumentEntity): Promise<DocumentEntity>;
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
