import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReviewQueuePort {
  enqueueForReview(params: {
    documentId: string;
    userId: string;
    reason: string;
  }): Promise<void>;
}

export class ReviewQueueStub implements ReviewQueuePort {
  constructor(private readonly supabase?: SupabaseClient) {}

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

    if (!this.supabase) {
      return;
    }

    // Persist review intent as an auditable record in existing audit_logs table.
    const { error } = await this.supabase.from("audit_logs").insert({
      user_id: params.userId,
      action: "document_manual_review_queued",
      resource_type: "document",
      resource_id: params.documentId,
      metadata: {
        reason: params.reason,
      },
    });

    if (error) {
      throw new Error(`Failed to persist manual review record: ${error.message}`);
    }
  }
}
