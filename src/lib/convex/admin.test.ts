/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  },
}));

import { createConvexWorkerClient, getDocumentWorkerToken } from "./admin";

describe("createConvexWorkerClient", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("requires a Convex URL and worker token", () => {
    delete process.env.CONVEX_URL;
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    delete process.env.DOCUMENT_WORKER_TOKEN;
    expect(() => createConvexWorkerClient()).toThrow(/Missing CONVEX_URL/);
  });

  it("rejects a short worker token", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://shiny-cricket-316.convex.cloud";
    process.env.DOCUMENT_WORKER_TOKEN = "short";
    expect(() => getDocumentWorkerToken()).toThrow(/DOCUMENT_WORKER_TOKEN/);
  });

  it("creates an unauthenticated HTTP client for token-gated worker functions", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://shiny-cricket-316.convex.cloud";
    process.env.DOCUMENT_WORKER_TOKEN = "document-worker-token";
    const client = createConvexWorkerClient();
    expect(client).toBeTruthy();
  });
});
