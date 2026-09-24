import { logger } from "@/lib/logger";
import type { QueuePort } from "../../application/ports/queue.port";
import { BullMQAdapter } from "./bullmq.adapter";
import { InMemoryDocumentQueue } from "./in-memory-document.queue";

export class QueueConfigurationError extends Error {
  constructor(
    message = "REDIS_URL is required when DOCUMENT_QUEUE_DRIVER=redis.",
  ) {
    super(message);
    this.name = "QueueConfigurationError";
  }
}

/**
 * Driver selection (Path-2 / staging without Upstash):
 * - `DOCUMENT_QUEUE_DRIVER=memory` → in-memory
 * - `DOCUMENT_QUEUE_DRIVER=redis` → BullMQ. Missing REDIS_URL or connection /
 *   enqueue errors fall back to in-memory so auth'd upload can still return 202
 *   after the Convex row is written. Factory-time config errors can still map
 *   to HTTP 503 if a caller throws QueueConfigurationError.
 * - unset / empty / unknown → in-memory, even if REDIS_URL is set (legacy
 *   Vercel env must not auto-select BullMQ).
 * Empty/whitespace REDIS_URL is treated as unset.
 */
export type DocumentQueueDriver = "memory" | "redis";

type QueueDriverEnv = {
  REDIS_URL?: string;
  DOCUMENT_QUEUE_DRIVER?: string;
};

export type CreateDocumentQueueDeps = {
  createRedisQueue?: (redisUrl: string) => QueuePort;
  createMemoryQueue?: () => QueuePort;
};

function processQueueEnv(): QueueDriverEnv {
  return {
    REDIS_URL: process.env.REDIS_URL,
    DOCUMENT_QUEUE_DRIVER: process.env.DOCUMENT_QUEUE_DRIVER,
  };
}

export function trimmedEnvValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveDocumentQueueDriver(
  env: QueueDriverEnv = processQueueEnv(),
): DocumentQueueDriver {
  const explicit = trimmedEnvValue(env.DOCUMENT_QUEUE_DRIVER)?.toLowerCase();
  if (explicit === "memory" || explicit === "redis") {
    return explicit;
  }
  return "memory";
}

let loggedMemoryDriver = false;
let loggedRedisFallback = false;
let testDeps: CreateDocumentQueueDeps | undefined;

export function resetDocumentQueueDriverLogForTests(): void {
  loggedMemoryDriver = false;
  loggedRedisFallback = false;
  testDeps = undefined;
}

export function setDocumentQueueDepsForTests(
  deps?: CreateDocumentQueueDeps,
): void {
  testDeps = deps;
}

function logMemoryDriverOnce(): void {
  if (loggedMemoryDriver) {
    return;
  }
  loggedMemoryDriver = true;
  logger.warn("document-intelligence queue driver is memory", {
    operation: "document.queue.driver",
    driver: "memory",
  });
}

function logRedisFallbackOnce(reason: string, error?: unknown): void {
  if (loggedRedisFallback) {
    return;
  }
  loggedRedisFallback = true;
  logger.warn("document-intelligence redis queue failed; falling back to memory", {
    operation: "document.queue.fallback",
    driver: "memory",
    reason,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message }
        : undefined,
  });
}

export class FallbackDocumentQueue implements QueuePort {
  private usingFallback = false;

  constructor(
    private readonly primary: QueuePort,
    private readonly fallback: QueuePort,
  ) {}

  async enqueueDocumentProcessing(params: {
    documentId: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<void> {
    if (this.usingFallback) {
      await this.fallback.enqueueDocumentProcessing(params);
      return;
    }
    try {
      await this.primary.enqueueDocumentProcessing(params);
    } catch (error) {
      this.usingFallback = true;
      logRedisFallbackOnce("enqueue_failed", error);
      await this.fallback.enqueueDocumentProcessing(params);
    }
  }
}

export function createDocumentQueue(
  env: QueueDriverEnv = processQueueEnv(),
  deps: CreateDocumentQueueDeps = testDeps ?? {},
): QueuePort {
  const driver = resolveDocumentQueueDriver(env);
  const memoryQueue = deps.createMemoryQueue?.() ?? new InMemoryDocumentQueue();

  if (driver === "memory") {
    logMemoryDriverOnce();
    return memoryQueue;
  }

  const redisUrl = trimmedEnvValue(env.REDIS_URL);
  if (!redisUrl) {
    logRedisFallbackOnce("missing_redis_url");
    return memoryQueue;
  }

  try {
    const redisQueue =
      deps.createRedisQueue?.(redisUrl) ?? new BullMQAdapter(redisUrl);
    return new FallbackDocumentQueue(redisQueue, memoryQueue);
  } catch (error) {
    logRedisFallbackOnce("redis_construct_failed", error);
    return memoryQueue;
  }
}
