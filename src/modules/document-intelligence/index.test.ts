import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDocumentControllerWithConvex,
  getDocumentStatusControllerWithConvex,
  resetDocumentQueueDriverLogForTests,
  setDocumentQueueDepsForTests,
} from "./index";

function withEnv<T>(
  values: Record<string, string | undefined>,
  fn: () => T,
): T {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("document-intelligence factories", () => {
  afterEach(() => {
    resetDocumentQueueDriverLogForTests();
  });

  it("does not require REDIS_URL for status reads", () => {
    withEnv({ REDIS_URL: undefined, DOCUMENT_QUEUE_DRIVER: undefined }, () => {
      expect(() =>
        getDocumentStatusControllerWithConvex({} as never),
      ).not.toThrow();
    });
  });

  it("writes a Convex row and returns queued when REDIS_URL is unset", async () => {
    await withEnv(
      { REDIS_URL: undefined, DOCUMENT_QUEUE_DRIVER: undefined },
      async () => {
        const mutation = vi.fn().mockResolvedValue(undefined);
        const query = vi.fn().mockResolvedValue(null);
        const controller = getDocumentControllerWithConvex({
          mutation,
          query,
        } as never);
        const result = await controller.uploadDocument({
          userId: "user-1",
          body: { documentType: "invoice", fileUrl: "https://files.example/f" },
          request: new Request("http://localhost/api/v1/documents/upload", {
            method: "POST",
          }),
        });
        expect(result).toEqual({
          documentId: expect.any(String),
          status: "queued",
        });
        expect(mutation).toHaveBeenCalled();
        const createArgs = mutation.mock.calls
          .map((call) => call[1] as { status?: string; externalId?: string })
          .find((args) => args?.status === "queued");
        expect(createArgs).toMatchObject({
          status: "queued",
          fileUrl: "https://files.example/f",
        });
      },
    );
  });

  it("ignores leftover REDIS_URL when driver is unset and still returns queued", async () => {
    await withEnv(
      { REDIS_URL: "rediss://stale-upstash.example", DOCUMENT_QUEUE_DRIVER: undefined },
      async () => {
        const mutation = vi.fn().mockResolvedValue(undefined);
        const query = vi.fn().mockResolvedValue(null);
        const controller = getDocumentControllerWithConvex({
          mutation,
          query,
        } as never);
        const result = await controller.uploadDocument({
          userId: "user-1",
          body: { documentType: "invoice", fileUrl: "https://files.example/f" },
          request: new Request("http://localhost/api/v1/documents/upload", {
            method: "POST",
          }),
        });
        expect(result).toEqual({
          documentId: expect.any(String),
          status: "queued",
        });
        expect(mutation).toHaveBeenCalled();
      },
    );
  });

  it("falls back to memory and returns queued when explicit redis enqueue fails", async () => {
    const enqueue = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    setDocumentQueueDepsForTests({
      createRedisQueue: () => ({
        enqueueDocumentProcessing: enqueue,
      }),
    });

    await withEnv(
      {
        REDIS_URL: "rediss://broken.example",
        DOCUMENT_QUEUE_DRIVER: "redis",
      },
      async () => {
        const mutation = vi.fn().mockResolvedValue(undefined);
        const query = vi.fn().mockResolvedValue(null);
        const controller = getDocumentControllerWithConvex({
          mutation,
          query,
        } as never);
        const result = await controller.uploadDocument({
          userId: "user-1",
          body: {
            documentType: "invoice",
            fileUrl: "https://files.example/f",
            idempotencyKey: "idem-redis-fail",
          },
          request: new Request("http://localhost/api/v1/documents/upload", {
            method: "POST",
          }),
        });
        expect(result).toEqual({
          documentId: expect.any(String),
          status: "queued",
        });
        expect(enqueue).toHaveBeenCalled();
        expect(mutation).toHaveBeenCalled();
        const createArgs = mutation.mock.calls
          .map((call) => call[1] as { status?: string })
          .find((args) => args?.status === "queued");
        expect(createArgs).toMatchObject({ status: "queued" });
      },
    );
  });
});
