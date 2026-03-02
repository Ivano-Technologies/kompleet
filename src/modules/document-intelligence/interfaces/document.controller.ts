import { randomUUID } from "node:crypto";
import { createRequestLogger, formatError } from "@/lib/logger";
import type { GetDocumentStatusUseCase } from "../application/get-document-status.usecase";
import type { ProcessDocumentUseCase } from "../application/process-document.usecase";
import {
  parseUploadDocumentRequest,
  type DocumentStatusResponseDto,
  type UploadDocumentResponseDto,
} from "./document.dto";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DocumentController {
  constructor(
    private readonly processDocumentUseCase: ProcessDocumentUseCase,
    private readonly getDocumentStatusUseCase: GetDocumentStatusUseCase,
  ) {}

  async uploadDocument(params: {
    userId: string;
    body: unknown;
    request: Request;
  }): Promise<UploadDocumentResponseDto> {
    const requestLogger = createRequestLogger(params.request, {
      userId: params.userId,
      operation: "document.upload",
    });

    const payload = parseUploadDocumentRequest(params.body);

    try {
      return await this.processDocumentUseCase.execute({
        userId: params.userId,
        documentType: payload.documentType,
        fileUrl: payload.fileUrl,
        idempotencyKey: payload.idempotencyKey ?? randomUUID(),
      });
    } catch (error) {
      requestLogger.error("Failed to queue document upload", {
        error: formatError(error),
      });
      throw error;
    }
  }

  async getDocumentStatus(params: {
    userId: string;
    documentId: string;
  }): Promise<DocumentStatusResponseDto> {
    const result = await this.getDocumentStatusUseCase.execute({
      userId: params.userId,
      documentId: params.documentId,
    });

    if (!result) {
      throw new NotFoundError("Document not found.");
    }

    return result;
  }
}
