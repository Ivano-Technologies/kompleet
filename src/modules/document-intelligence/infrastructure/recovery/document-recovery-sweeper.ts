import type { AuditLogPort } from "../../application/ports/audit-log.port";
import type { QueuePort } from "../../application/ports/queue.port";
import type { ProcessingMetricsPort } from "../metrics/processing-metrics";

export interface RecoveryRepository {
  findStaleProcessingDocuments(params: {
    olderThanMinutes: number;
    limit: number;
  }): Promise<
    Array<{
      documentId: string;
      userId: string;
      idempotencyKey: string;
      processingStartedAt: Date | null;
    }>
  >;
  requeueStaleProcessingDocument(params: {
    documentId: string;
    userId: string;
  }): Promise<boolean>;
}

export class DocumentRecoverySweeper {
  constructor(
    private readonly repository: RecoveryRepository,
    private readonly queue: QueuePort,
    private readonly auditLog: AuditLogPort,
    private readonly metrics: ProcessingMetricsPort,
    private readonly timeoutMinutes = 15,
    private readonly batchLimit = 100,
  ) {}

  async runSweep(): Promise<number> {
    const staleDocuments = await this.repository.findStaleProcessingDocuments({
      olderThanMinutes: this.timeoutMinutes,
      limit: this.batchLimit,
    });

    let requeueCount = 0;

    for (const item of staleDocuments) {
      this.metrics.recordStuckProcessingDetected(item.documentId);

      const requeued = await this.repository.requeueStaleProcessingDocument({
        documentId: item.documentId,
        userId: item.userId,
      });
      if (!requeued) {
        continue;
      }

      await this.queue.enqueueDocumentProcessing({
        documentId: item.documentId,
        userId: item.userId,
        idempotencyKey: item.idempotencyKey,
      });

      await this.auditLog.record({
        userId: item.userId,
        documentId: item.documentId,
        action: "document_requeued_due_to_timeout",
        metadata: {
          timeoutMinutes: this.timeoutMinutes,
          processingStartedAt: item.processingStartedAt?.toISOString() ?? null,
        },
      });

      this.metrics.recordRecoveryRequeue(item.documentId);
      requeueCount += 1;
    }

    return requeueCount;
  }
}
