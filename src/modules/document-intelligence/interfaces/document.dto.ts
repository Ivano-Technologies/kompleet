import type { DocumentType } from "../domain/document.entity";
import type { GetDocumentStatusOutput } from "../application/get-document-status.usecase";
import type { ProcessDocumentOutput } from "../application/process-document.usecase";

export interface UploadDocumentRequestDto {
  documentType: DocumentType;
  fileUrl: string;
  idempotencyKey?: string;
}

export interface UploadDocumentResponseDto extends ProcessDocumentOutput {}

export interface DocumentStatusResponseDto extends GetDocumentStatusOutput {}

export function parseUploadDocumentRequest(
  input: unknown,
): UploadDocumentRequestDto {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }

  const data = input as Record<string, unknown>;
  const { documentType, fileUrl, idempotencyKey } = data;

  if (typeof documentType !== "string") {
    throw new Error("documentType is required.");
  }

  if (typeof fileUrl !== "string" || fileUrl.length === 0) {
    throw new Error("fileUrl is required.");
  }

  if (
    idempotencyKey !== undefined &&
    (typeof idempotencyKey !== "string" || idempotencyKey.length === 0)
  ) {
    throw new Error("idempotencyKey must be a non-empty string when provided.");
  }

  return {
    documentType: documentType as DocumentType,
    fileUrl,
    idempotencyKey,
  };
}
