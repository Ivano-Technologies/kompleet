import { Queue, type JobsOptions } from "bullmq";
import type { QueuePort } from "../../application/ports/queue.port";

export const DOCUMENT_PROCESSING_QUEUE = "document-processing";
export const PROCESS_DOCUMENT_JOB = "process-document";

export interface ProcessDocumentJobData {
  documentId: string;
  userId: string;
  idempotencyKey: string;
}

export interface QueueLike {
  add(
    name: string,
    data: ProcessDocumentJobData,
    opts?: JobsOptions,
  ): Promise<unknown>;
}

export interface BullMqTuningOptions {
  attempts?: number;
  backoffDelayMs?: number;
  removeOnCompleteAgeSeconds?: number;
  removeOnCompleteCount?: number;
  removeOnFailAgeSeconds?: number;
  removeOnFailCount?: number;
}

export class BullMQAdapter implements QueuePort {
  private readonly queue: QueueLike;
  private readonly tuning: Required<BullMqTuningOptions>;

  constructor(redisUrl: string, queue?: QueueLike, tuning?: BullMqTuningOptions) {
    this.queue =
      queue ??
      new Queue(DOCUMENT_PROCESSING_QUEUE, {
        connection: {
          url: redisUrl,
        },
      });
    this.tuning = {
      attempts: tuning?.attempts ?? 3,
      backoffDelayMs: tuning?.backoffDelayMs ?? 2000,
      removeOnCompleteAgeSeconds: tuning?.removeOnCompleteAgeSeconds ?? 600,
      removeOnCompleteCount: tuning?.removeOnCompleteCount ?? 1000,
      removeOnFailAgeSeconds: tuning?.removeOnFailAgeSeconds ?? 3600,
      removeOnFailCount: tuning?.removeOnFailCount ?? 1000,
    };
  }

  async enqueueDocumentProcessing(params: {
    documentId: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<void> {
    await this.queue.add(
      PROCESS_DOCUMENT_JOB,
      {
        documentId: params.documentId,
        userId: params.userId,
        idempotencyKey: params.idempotencyKey,
      },
      {
        jobId: params.documentId,
        attempts: this.tuning.attempts,
        backoff: {
          type: "exponential",
          delay: this.tuning.backoffDelayMs,
        },
        removeOnComplete: {
          age: this.tuning.removeOnCompleteAgeSeconds,
          count: this.tuning.removeOnCompleteCount,
        },
        removeOnFail: {
          age: this.tuning.removeOnFailAgeSeconds,
          count: this.tuning.removeOnFailCount,
        },
      },
    );
  }
}
