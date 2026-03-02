export interface OcrEnginePort {
  extractStructuredData(params: {
    fileUrl: string;
    documentType: string;
  }): Promise<Record<string, unknown>>;
}
