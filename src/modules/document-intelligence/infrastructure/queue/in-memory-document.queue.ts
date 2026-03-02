import type { QueuePort } from "../../application/ports/queue.port";

export class InMemoryDocumentQueue implements QueuePort {
  private readonly jobs: Array<{
    documentId: string;
    userId: string;
    idempotencyKey: string;
  }> = [];

  async enqueueDocumentProcessing(params: {
    documentId: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<void> {
    this.jobs.push(params);
  }
}
