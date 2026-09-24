import { describe, expect, it, vi } from "vitest";
import {
  getDocumentControllerWithConvex,
  getDocumentStatusControllerWithConvex,
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
});
