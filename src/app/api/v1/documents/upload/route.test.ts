/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getAuthedConvex,
  cookies,
  uploadDocument,
  getDocumentControllerWithConvex,
  withRateLimitImpl,
  QueueConfigurationError,
} = vi.hoisted(() => {
  class QueueConfigurationError extends Error {
    constructor(message = "REDIS_URL is required for document queueing.") {
      super(message);
      this.name = "QueueConfigurationError";
    }
  }
  return {
    getAuthedConvex: vi.fn(),
    cookies: vi.fn(async () => ({})),
    uploadDocument: vi.fn(),
    getDocumentControllerWithConvex: vi.fn(),
    withRateLimitImpl: vi.fn(<T,>(handler: T) => handler),
    QueueConfigurationError,
  };
});

vi.mock("next/headers", () => ({
  cookies: () => cookies(),
}));

vi.mock("@/lib/convex/server", () => ({
  getAuthedConvex: (...args: unknown[]) => getAuthedConvex(...args),
  isUnauthorized: (error: unknown) =>
    error instanceof Error &&
    /unauthorized|authentication required/i.test(error.message),
}));

vi.mock("@/modules/document-intelligence", () => ({
  QueueConfigurationError,
  getDocumentControllerWithConvex: (...args: unknown[]) =>
    getDocumentControllerWithConvex(...args),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => withRateLimitImpl(handler),
}));

import { POST } from "./route";

function request(body: unknown = { documentType: "invoice", fileUrl: "https://f" }) {
  return new NextRequest("http://localhost/api/v1/documents/upload", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/v1/documents/upload", () => {
  beforeEach(() => {
    getAuthedConvex.mockReset();
    uploadDocument.mockReset();
    getDocumentControllerWithConvex.mockReset();
    getDocumentControllerWithConvex.mockImplementation(() => ({
      uploadDocument: (...args: unknown[]) => uploadDocument(...args),
    }));
    cookies.mockReset();
    cookies.mockResolvedValue({});
    withRateLimitImpl.mockImplementation(<T,>(handler: T) => handler);
  });

  it("returns 401 when Convex auth is missing and never touches the queue factory", async () => {
    getAuthedConvex.mockResolvedValue(null);
    getDocumentControllerWithConvex.mockImplementation(() => {
      throw new QueueConfigurationError();
    });
    const res = await POST(request());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Unauthorized" });
    expect(getDocumentControllerWithConvex).not.toHaveBeenCalled();
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("does not map a Redis misconfig throw to 400 when the caller is unauthenticated", async () => {
    getAuthedConvex.mockResolvedValue(null);
    const res = await POST(request());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).not.toMatch(/REDIS_URL/);
    expect(getDocumentControllerWithConvex).not.toHaveBeenCalled();
  });

  it("returns 503 when authenticated but REDIS_URL is missing", async () => {
    getAuthedConvex.mockResolvedValue({
      user: { id: "user-1" },
      convex: {},
    });
    getDocumentControllerWithConvex.mockImplementation(() => {
      throw new QueueConfigurationError();
    });
    const res = await POST(request());
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      error: "Service unavailable",
      message: "REDIS_URL is required for document queueing.",
    });
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("returns 400 for body validation after auth, not for queue misconfig", async () => {
    getAuthedConvex.mockResolvedValue({
      user: { id: "user-1" },
      convex: {},
    });
    uploadDocument.mockRejectedValue(new Error("documentType is required."));
    const res = await POST(request({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "Validation error",
      message: "documentType is required.",
    });
  });

  it("queues a document on Convex and returns 202", async () => {
    getAuthedConvex.mockResolvedValue({
      user: { id: "user-1" },
      convex: {},
    });
    uploadDocument.mockResolvedValue({ documentId: "doc-1", status: "queued" });
    const res = await POST(request());
    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toEqual({
      documentId: "doc-1",
      status: "queued",
    });
    expect(uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
    );
  });

  it("rethrows Next.js cookies() control-flow errors", async () => {
    const postpone = Object.assign(new Error("Dynamic server usage: cookies"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    cookies.mockRejectedValue(postpone);
    await expect(POST(request())).rejects.toMatchObject({
      digest: "DYNAMIC_SERVER_USAGE",
    });
    expect(getAuthedConvex).not.toHaveBeenCalled();
    expect(getDocumentControllerWithConvex).not.toHaveBeenCalled();
  });
});
