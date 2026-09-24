/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

import { GET } from "@/app/api/health/db/route";

const TOKEN = "keepalive-test-token-32-chars-min";

function requestWith(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/health/db", { headers });
}

describe("GET /api/health/db", () => {
  const previousToken = process.env.KEEPALIVE_TOKEN;
  const previousFetch = globalThis.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    process.env.KEEPALIVE_TOKEN = TOKEN;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ_test_anon";
  });

  afterEach(() => {
    globalThis.fetch = previousFetch;
    if (previousToken === undefined) {
      delete process.env.KEEPALIVE_TOKEN;
    } else {
      process.env.KEEPALIVE_TOKEN = previousToken;
    }
  });

  it("returns 503 when KEEPALIVE_TOKEN is unset", async () => {
    delete process.env.KEEPALIVE_TOKEN;
    const res = await GET(requestWith({ "x-keepalive-token": TOKEN }));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ status: "misconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the token header is missing", async () => {
    const res = await GET(requestWith());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ status: "unauthorized" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is wrong", async () => {
    const res = await GET(requestWith({ "x-keepalive-token": "nope" }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ status: "unauthorized" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 200 on a successful PostgREST round-trip and uses the anon key", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const res = await GET(requestWith({ "x-keepalive-token": TOKEN }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.dbLatencyMs).toBe("number");
    expect(typeof body.timestamp).toBe("string");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:54321/rest/v1/tax_rules?select=id",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          apikey: "eyJ_test_anon",
          Authorization: "Bearer eyJ_test_anon",
        }),
      }),
    );
  });

  it("returns 503 when the database query errors", async () => {
    fetchMock.mockResolvedValue(new Response("paused", { status: 503 }));
    const res = await GET(requestWith({ "x-keepalive-token": TOKEN }));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ status: "error" });
  });

  it("returns 503 when the client throws", async () => {
    fetchMock.mockRejectedValue(new Error("ENOTFOUND"));
    const res = await GET(requestWith({ "x-keepalive-token": TOKEN }));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ status: "error" });
  });
});
