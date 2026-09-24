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

const queuedRow = {
  id: "doc-convex-1",
  user_id: "user-1",
  status: "queued",
  document_type: "invoice",
  file_url: "https://files.example/f",
  file_name: null,
  content_type: null,
  idempotency_key: null,
  confidence_score: null,
  structured_data: null,
  error_message: null,
  processing_attempt_count: 0,
  created_at: "2026-09-24T00:00:00.000Z",
  updated_at: "2026-09-24T00:00:00.000Z",
};

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
        const mutation = vi.fn().mockResolvedValue(queuedRow);
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
          documentId: "doc-convex-1",
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
        const mutation = vi.fn().mockResolvedValue(queuedRow);
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
          documentId: "doc-convex-1",
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
        const mutation = vi.fn().mockResolvedValue(queuedRow);
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
          documentId: "doc-convex-1",
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

  it("returns queued on the live shiny-cricket-316 createMine validator", async () => {
    await withEnv(
      { REDIS_URL: undefined, DOCUMENT_QUEUE_DRIVER: undefined },
      async () => {
        const mutation = vi.fn().mockImplementation((_fn, args: { documentType?: string }) => {
          if (args && "documentType" in args) {
            return Promise.reject(
              new Error(
                "ArgumentValidationError: Object contains extra field `documentType` that is not in the validator.",
              ),
            );
          }
          return Promise.resolve({
            ...queuedRow,
            id: "p4-path2-doc",
            idempotency_key: "p4-path2-idem-001",
          });
        });
        const query = vi.fn().mockRejectedValue(
          new Error(
            "Could not find public function for 'documents:getMineByIdempotencyKey'.",
          ),
        );
        const controller = getDocumentControllerWithConvex({
          mutation,
          query,
        } as never);
        const first = await controller.uploadDocument({
          userId: "user-1",
          body: {
            documentType: "invoice",
            fileUrl: "https://files.example/f",
            idempotencyKey: "p4-path2-idem-001",
          },
          request: new Request("http://localhost/api/v1/documents/upload", {
            method: "POST",
          }),
        });
        const second = await controller.uploadDocument({
          userId: "user-1",
          body: {
            documentType: "invoice",
            fileUrl: "https://files.example/f",
            idempotencyKey: "p4-path2-idem-001",
          },
          request: new Request("http://localhost/api/v1/documents/upload", {
            method: "POST",
          }),
        });
        expect(first).toEqual({
          documentId: "p4-path2-doc",
          status: "queued",
        });
        expect(second.documentId).toBe(first.documentId);
        const createArgs = mutation.mock.calls
          .map((call) => call[1] as { status?: string; documentType?: string })
          .filter((args) => args?.status === "queued");
        expect(createArgs.length).toBeGreaterThanOrEqual(2);
        const compatible = createArgs.find((args) => !("documentType" in args));
        expect(compatible).toMatchObject({
          idempotencyKey: "p4-path2-idem-001",
          status: "queued",
          payload: expect.objectContaining({
            documentType: "invoice",
            fileUrl: "https://files.example/f",
          }),
        });
        expect(compatible).not.toHaveProperty("documentType");
      },
    );
  });
});
