export interface TaxMappingPort {
  mapDocumentToTaxContext(params: {
    userId: string;
    documentId: string;
    structuredData: Record<string, unknown>;
  }): Promise<void>;
}
