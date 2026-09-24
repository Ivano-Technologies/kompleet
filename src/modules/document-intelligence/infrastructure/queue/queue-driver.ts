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

export type DocumentQueueDriver = "memory" | "redis";

type QueueDriverEnv = {
  REDIS_URL?: string;
  DOCUMENT_QUEUE_DRIVER?: string;
};

function processQueueEnv(): QueueDriverEnv {
  return {
    REDIS_URL: process.env.REDIS_URL,
    DOCUMENT_QUEUE_DRIVER: process.env.DOCUMENT_QUEUE_DRIVER,
  };
}

export function resolveDocumentQueueDriver(
  env: QueueDriverEnv = processQueueEnv(),
): DocumentQueueDriver {
  const explicit = env.DOCUMENT_QUEUE_DRIVER?.trim().toLowerCase();
  if (explicit === "memory" || explicit === "redis") {
    return explicit;
  }
  return env.REDIS_URL ? "redis" : "memory";
}

let loggedMemoryDriver = false;

export function resetDocumentQueueDriverLogForTests(): void {
  loggedMemoryDriver = false;
}

export function createDocumentQueue(
  env: QueueDriverEnv = processQueueEnv(),
): QueuePort {
  const driver = resolveDocumentQueueDriver(env);
  if (driver === "memory") {
    if (!loggedMemoryDriver) {
      loggedMemoryDriver = true;
      logger.warn("document-intelligence queue driver is memory", {
        operation: "document.queue.driver",
        driver: "memory",
      });
    }
    return new InMemoryDocumentQueue();
  }

  const redisUrl = env.REDIS_URL;
  if (!redisUrl) {
    throw new QueueConfigurationError();
  }
  return new BullMQAdapter(redisUrl);
}
