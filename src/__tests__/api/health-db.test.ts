/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const fromMock = vi.fn(() => ({ select: selectMock }));
const createClientMock = vi.fn(() => ({ from: fromMock }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

import { GET } from "@/app/api/health/db/route";

const TOKEN = "keepalive-test-token-32-chars-min";

function requestWith(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/health/db", { headers });
}

describe("GET /api/health/db", () => {
  const previousToken = process.env.KEEPALIVE_TOKEN;
  const previousServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    selectMock.mockReset();
    fromMock.mockClear();
    createClientMock.mockClear();
    process.env.KEEPALIVE_TOKEN = TOKEN;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ_test_anon";
  });

  afterEach(() => {
    if (previousToken === undefined) {
      delete process.env.KEEPALIVE_TOKEN;
    } else {
      process.env.KEEPALIVE_TOKEN = previousToken;
    }
    if (previousServiceRole === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRole;
    }
  });

  it("returns 503 when KEEPALIVE_TOKEN is unset", async () => {
    delete process.env.KEEPALIVE_TOKEN;
    const res = await GET(requestWith({ "x-keepalive-token": TOKEN }));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ status: "misconfigured" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the token header is missing", async () => {
    const res = await GET(requestWith());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ status: "unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is wrong", async () => {
    const res = await GET(requestWith({ "x-keepalive-token": "nope" }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ status: "unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 200 on a successful DB round-trip and uses the anon key", async () => {
    selectMock.mockResolvedValue({ error: null, count: 0 });
    const res = await GET(requestWith({ "x-keepalive-token": TOKEN }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.dbLatencyMs).toBe("number");
    expect(typeof body.timestamp).toBe("string");
    expect(createClientMock).toHaveBeenCalledWith(
      "http://localhost:54321",
      "eyJ_test_anon",
      expect.objectContaining({
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
    expect(fromMock).toHaveBeenCalledWith("tax_rules");
  });

  it("returns 503 when the database query errors", async () => {
    selectMock.mockResolvedValue({ error: { message: "paused" }, count: null });
    const res = await GET(requestWith({ "x-keepalive-token": TOKEN }));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ status: "error" });
  });

  it("returns 503 when the client throws", async () => {
    selectMock.mockRejectedValue(new Error("ENOTFOUND"));
    const res = await GET(requestWith({ "x-keepalive-token": TOKEN }));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ status: "error" });
  });
});
