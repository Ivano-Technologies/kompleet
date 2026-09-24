import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryDocumentQueue } from "./in-memory-document.queue";

const { warn } = vi.hoisted(() => ({
  warn: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: (...args: unknown[]) => warn(...args) },
}));

import {
  createDocumentQueue,
  FallbackDocumentQueue,
  QueueConfigurationError,
  resetDocumentQueueDriverLogForTests,
  resolveDocumentQueueDriver,
} from "./queue-driver";

describe("document queue driver", () => {
  beforeEach(() => {
    warn.mockReset();
    resetDocumentQueueDriverLogForTests();
  });

  afterEach(() => {
    resetDocumentQueueDriverLogForTests();
  });

  it("defaults to memory when REDIS_URL is unset", () => {
    expect(resolveDocumentQueueDriver({})).toBe("memory");
  });

  it("defaults to memory when REDIS_URL is leftover and driver is unset", () => {
    expect(
      resolveDocumentQueueDriver({
        REDIS_URL: "rediss://example",
      }),
    ).toBe("memory");
  });

  it("treats whitespace REDIS_URL as unset", () => {
    expect(
      resolveDocumentQueueDriver({
        REDIS_URL: "   ",
        DOCUMENT_QUEUE_DRIVER: "  ",
      }),
    ).toBe("memory");
  });

  it("honors explicit DOCUMENT_QUEUE_DRIVER=memory even with REDIS_URL", () => {
    expect(
      resolveDocumentQueueDriver({
        DOCUMENT_QUEUE_DRIVER: "memory",
        REDIS_URL: "rediss://example",
      }),
    ).toBe("memory");
  });

  it("honors explicit DOCUMENT_QUEUE_DRIVER=redis", () => {
    expect(
      resolveDocumentQueueDriver({
        DOCUMENT_QUEUE_DRIVER: "redis",
      }),
    ).toBe("redis");
  });

  it("builds an in-memory queue and logs the driver once", () => {
    const first = createDocumentQueue({});
    const second = createDocumentQueue({});
    expect(first).toBeInstanceOf(InMemoryDocumentQueue);
    expect(second).toBeInstanceOf(InMemoryDocumentQueue);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "document-intelligence queue driver is memory",
      expect.objectContaining({ driver: "memory" }),
    );
  });

  it("falls back to memory when redis is explicit without REDIS_URL", () => {
    const queue = createDocumentQueue({
      DOCUMENT_QUEUE_DRIVER: "redis",
    });
    expect(queue).toBeInstanceOf(InMemoryDocumentQueue);
    expect(warn).toHaveBeenCalledWith(
      "document-intelligence redis queue failed; falling back to memory",
      expect.objectContaining({ reason: "missing_redis_url" }),
    );
  });

  it("falls back to memory when redis is explicit with whitespace REDIS_URL", () => {
    const queue = createDocumentQueue({
      DOCUMENT_QUEUE_DRIVER: "redis",
      REDIS_URL: "  ",
    });
    expect(queue).toBeInstanceOf(InMemoryDocumentQueue);
  });

  it("wraps explicit redis in a fallback queue", () => {
    const redisQueue = new InMemoryDocumentQueue();
    const queue = createDocumentQueue(
      {
        DOCUMENT_QUEUE_DRIVER: "redis",
        REDIS_URL: "rediss://example",
      },
      { createRedisQueue: () => redisQueue },
    );
    expect(queue).toBeInstanceOf(FallbackDocumentQueue);
  });

  it("falls back to memory when redis construction throws", () => {
    const queue = createDocumentQueue(
      {
        DOCUMENT_QUEUE_DRIVER: "redis",
        REDIS_URL: "rediss://example",
      },
      {
        createRedisQueue: () => {
          throw new Error("invalid redis url");
        },
      },
    );
    expect(queue).toBeInstanceOf(InMemoryDocumentQueue);
    expect(warn).toHaveBeenCalledWith(
      "document-intelligence redis queue failed; falling back to memory",
      expect.objectContaining({ reason: "redis_construct_failed" }),
    );
  });

  it("falls back to memory when redis enqueue fails and still succeeds", async () => {
    const enqueue = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const queue = createDocumentQueue(
      {
        DOCUMENT_QUEUE_DRIVER: "redis",
        REDIS_URL: "rediss://example",
      },
      {
        createRedisQueue: () => ({
          enqueueDocumentProcessing: enqueue,
        }),
      },
    );

    await expect(
      queue.enqueueDocumentProcessing({
        documentId: "doc-1",
        userId: "user-1",
        idempotencyKey: "idem-1",
      }),
    ).resolves.toBeUndefined();
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "document-intelligence redis queue failed; falling back to memory",
      expect.objectContaining({ reason: "enqueue_failed" }),
    );

    await queue.enqueueDocumentProcessing({
      documentId: "doc-2",
      userId: "user-1",
      idempotencyKey: "idem-2",
    });
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(
      warn.mock.calls.filter(
        ([message]) =>
          message ===
          "document-intelligence redis queue failed; falling back to memory",
      ),
    ).toHaveLength(1);
  });

  it("keeps QueueConfigurationError available for hard 503 mapping", () => {
    expect(new QueueConfigurationError().name).toBe("QueueConfigurationError");
  });
});
