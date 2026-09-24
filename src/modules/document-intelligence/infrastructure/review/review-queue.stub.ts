import { logger } from "@/lib/logger";
import type { AuditLogPort } from "../../application/ports/audit-log.port";

export interface ReviewQueuePort {
  enqueueForReview(params: {
    documentId: string;
    userId: string;
    reason: string;
  }): Promise<void>;
}

export class ReviewQueueStub implements ReviewQueuePort {
  constructor(private readonly auditLog?: AuditLogPort) {}

  async enqueueForReview(params: {
    documentId: string;
    userId: string;
    reason: string;
  }): Promise<void> {
    logger.warn("Document routed to manual review queue", {
      operation: "worker.document.review_queue.enqueue",
      documentId: params.documentId,
      userId: params.userId,
      reason: params.reason,
    });

    if (!this.auditLog) {
      return;
    }

    await this.auditLog.record({
      userId: params.userId,
      documentId: params.documentId,
      action: "document_manual_review_queued",
      metadata: {
        reason: params.reason,
      },
    });
  }
}
