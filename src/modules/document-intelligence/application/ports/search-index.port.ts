export interface SearchIndexPort {
  indexDocument(params: {
    documentId: string;
    userId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}
