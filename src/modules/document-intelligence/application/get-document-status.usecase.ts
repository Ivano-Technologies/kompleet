import type { DocumentRepositoryPort } from "./ports/document-repository.port";

export interface GetDocumentStatusInput {
  userId: string;
  documentId: string;
}

export interface GetDocumentStatusOutput {
  documentId: string;
  status: string;
  confidenceScore: number | null;
  structuredData: Record<string, unknown> | null;
}

export class GetDocumentStatusUseCase {
  constructor(private readonly repository: DocumentRepositoryPort) {}

  async execute(
    input: GetDocumentStatusInput,
  ): Promise<GetDocumentStatusOutput | null> {
    const document = await this.repository.findById(input.documentId, input.userId);
    if (!document) {
      return null;
    }

    return {
      documentId: document.id,
      status: document.status,
      confidenceScore: document.confidenceScore,
      structuredData: document.structuredData,
    };
  }
}
