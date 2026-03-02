import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { SupabaseDocumentRepository } from "@/modules/document-intelligence/infrastructure/persistence/supabase-document.repository";
import { BullMQAdapter } from "@/modules/document-intelligence/infrastructure/queue/bullmq.adapter";
import { SupabaseAuditLogAdapter } from "@/modules/document-intelligence/infrastructure/audit/supabase-audit-log.adapter";
import { ProcessingMetricsAdapter } from "@/modules/document-intelligence/infrastructure/metrics/processing-metrics";
import { DocumentRecoverySweeper } from "@/modules/document-intelligence/infrastructure/recovery/document-recovery-sweeper";

const redisUrl = requireEnv("REDIS_URL");
const supabaseUrl = process.env.SUPABASE_POOLER_URL ?? requireEnv("SUPABASE_URL");
const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_KEY");

const timeoutMinutes = parseInt(
  process.env.PROCESSING_TIMEOUT_MINUTES ?? "15",
  10,
);
const sweepIntervalMs = parseInt(
  process.env.RECOVERY_SWEEP_INTERVAL_MS ?? "300000",
  10,
);
const batchLimit = parseInt(process.env.RECOVERY_SWEEP_BATCH_LIMIT ?? "100", 10);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const repository = new SupabaseDocumentRepository(supabase);
const queue = new BullMQAdapter(redisUrl);
const auditLog = new SupabaseAuditLogAdapter(supabase);
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
  usingSupabasePooler: Boolean(process.env.SUPABASE_POOLER_URL),
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
