export interface QueuePort {
  enqueueDocumentProcessing(params: {
    documentId: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<void>;
}
