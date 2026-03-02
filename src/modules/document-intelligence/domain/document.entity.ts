export const DOCUMENT_STATUSES = [
  "queued",
  "processing",
  "validated",
  "completed",
  "failed",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type DocumentType = "invoice" | "receipt" | "statement" | "other";

export interface DocumentEntity {
  id: string;
  userId: string;
  documentType: DocumentType;
  fileUrl: string;
  status: DocumentStatus;
  idempotencyKey: string;
  confidenceScore: number | null;
  structuredData: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createQueuedDocument(params: {
  id: string;
  userId: string;
  documentType: DocumentType;
  fileUrl: string;
  idempotencyKey: string;
}): DocumentEntity {
  const now = new Date();

  return {
    id: params.id,
    userId: params.userId,
    documentType: params.documentType,
    fileUrl: params.fileUrl,
    status: "queued",
    idempotencyKey: params.idempotencyKey,
    confidenceScore: null,
    structuredData: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
}
