import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const clientFlush = vi.fn(async () => true);

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(() => "0123456789abcdef0123456789abcdef"),
  flush: vi.fn(async () => true),
  getClient: vi.fn(() => ({
    getDsn: () => ({ host: "ingest.example" }),
    flush: clientFlush,
  })),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: (handler: (request: Request) => Promise<Response>) => handler,
}));

function previewRequest() {
  return new NextRequest("http://localhost/api/sentry-test");
}

describe("GET /api/sentry-test", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns 404 in production so the endpoint stays closed", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { GET } = await import("./route");
    const res = await GET(previewRequest());
    expect(res.status).toBe(404);
  });

  it("returns 404 when VERCEL_ENV is unset", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    const { GET } = await import("./route");
    const res = await GET(previewRequest());
    expect(res.status).toBe(404);
  });

  it("captures and flushes a test error on Vercel preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const Sentry = await import("@sentry/nextjs");
    const { GET } = await import("./route");
    const res = await GET(previewRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.eventId).toBe("0123456789abcdef0123456789abcdef");
    expect(body.flushed).toBe(true);
    expect(body.hasDsn).toBe(true);
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(clientFlush).toHaveBeenCalled();
  });
});
