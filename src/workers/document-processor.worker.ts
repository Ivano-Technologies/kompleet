import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import {
  DOCUMENT_PROCESSING_QUEUE,
  PROCESS_DOCUMENT_JOB,
  type ProcessDocumentJobData,
} from "@/modules/document-intelligence/infrastructure/queue/bullmq.adapter";
import { DocumentProcessor } from "@/modules/document-intelligence/infrastructure/queue/document-processor";
import { SupabaseDocumentRepository } from "@/modules/document-intelligence/infrastructure/persistence/supabase-document.repository";
import { SupabaseAuditLogAdapter } from "@/modules/document-intelligence/infrastructure/audit/supabase-audit-log.adapter";
import { TesseractAdapter } from "@/modules/document-intelligence/infrastructure/ocr/tesseract.adapter";
import { ProcessingMetricsAdapter } from "@/modules/document-intelligence/infrastructure/metrics/processing-metrics";
import { ReviewQueueStub } from "@/modules/document-intelligence/infrastructure/review/review-queue.stub";

const redisUrl = requireEnv("REDIS_URL");
const supabaseUrl = process.env.SUPABASE_POOLER_URL ?? requireEnv("SUPABASE_URL");
const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const workerConcurrency = parsePositiveInt(
  process.env.DOCUMENT_WORKER_CONCURRENCY,
  2,
);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const repository = new SupabaseDocumentRepository(supabase);
const auditLog = new SupabaseAuditLogAdapter(supabase);
const metrics = new ProcessingMetricsAdapter();
const reviewQueue = new ReviewQueueStub(supabase);
await TesseractAdapter.ensureBinaryAvailable();
const ocrEngine = new TesseractAdapter();
const processor = new DocumentProcessor(
  repository,
  ocrEngine,
  auditLog,
  metrics,
  reviewQueue,
);

const worker = new Worker(
  DOCUMENT_PROCESSING_QUEUE,
  async (job) => {
    if (job.name !== PROCESS_DOCUMENT_JOB) {
      return;
    }

    const payload = job.data as ProcessDocumentJobData;
    await processor.processJob({
      documentId: payload.documentId,
      userId: payload.userId,
    });
  },
  {
    connection: {
      url: redisUrl,
    },
    concurrency: workerConcurrency,
  },
);

worker.on("ready", () => {
  logger.info("Document worker started", {
    operation: "worker.document.start",
    workerConcurrency,
    usingSupabasePooler: Boolean(process.env.SUPABASE_POOLER_URL),
  });
});

worker.on("failed", (job, error) => {
  logger.error("Document worker job failed", {
    operation: "worker.document.job.failed",
    documentId: (job?.data as ProcessDocumentJobData | undefined)?.documentId,
    error: error.message,
  });
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing ${name} for worker runtime.`);
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}
