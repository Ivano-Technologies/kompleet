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

  it("defaults to redis when REDIS_URL is set and driver is unset", () => {
    expect(
      resolveDocumentQueueDriver({
        REDIS_URL: "rediss://example",
      }),
    ).toBe("redis");
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

  it("throws only when redis is explicitly selected without REDIS_URL", () => {
    expect(() =>
      createDocumentQueue({
        DOCUMENT_QUEUE_DRIVER: "redis",
      }),
    ).toThrow(QueueConfigurationError);
  });
});
