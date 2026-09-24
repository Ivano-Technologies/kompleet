import { logger } from "@/lib/logger";
import {
  createConvexWorkerClient,
  getDocumentWorkerToken,
} from "@/lib/convex/admin";
import { ConvexDocumentRepository } from "@/modules/document-intelligence/infrastructure/persistence/convex-document.repository";
import { BullMQAdapter } from "@/modules/document-intelligence/infrastructure/queue/bullmq.adapter";
import { ConvexAuditLogAdapter } from "@/modules/document-intelligence/infrastructure/audit/convex-audit-log.adapter";
import { ProcessingMetricsAdapter } from "@/modules/document-intelligence/infrastructure/metrics/processing-metrics";
import { DocumentRecoverySweeper } from "@/modules/document-intelligence/infrastructure/recovery/document-recovery-sweeper";

const redisUrl = requireEnv("REDIS_URL");

const timeoutMinutes = parseInt(
  process.env.PROCESSING_TIMEOUT_MINUTES ?? "15",
  10,
);
const sweepIntervalMs = parseInt(
  process.env.RECOVERY_SWEEP_INTERVAL_MS ?? "300000",
  10,
);
const batchLimit = parseInt(process.env.RECOVERY_SWEEP_BATCH_LIMIT ?? "100", 10);

const convex = createConvexWorkerClient();
const workerToken = getDocumentWorkerToken();
const repository = new ConvexDocumentRepository(convex, {
  admin: true,
  workerToken,
});
const queue = new BullMQAdapter(redisUrl);
const auditLog = new ConvexAuditLogAdapter(convex, {
  admin: true,
  workerToken,
});
const metrics = new ProcessingMetricsAdapter();

const sweeper = new DocumentRecoverySweeper(
  repository,
  queue,
  auditLog,
  metrics,
  timeoutMinutes,
  batchLimit,
);

logger.info("Document recovery worker started", {
  operation: "worker.document.recovery.start",
  timeoutMinutes,
  sweepIntervalMs,
  batchLimit,
  store: "convex",
});

await runSweep();
setInterval(runSweep, sweepIntervalMs);

async function runSweep() {
  try {
    const count = await sweeper.runSweep();
    logger.info("Document recovery sweep completed", {
      operation: "worker.document.recovery.sweep",
      requeueCount: count,
    });
  } catch (error) {
    logger.error("Document recovery sweep failed", {
      operation: "worker.document.recovery.error",
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing ${name} for recovery worker runtime.`);
  }
  return value;
}
