/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getConvexAccessToken,
  createConvexHttpClient,
  cookies,
  withRateLimitImpl,
} = vi.hoisted(() => ({
  getConvexAccessToken: vi.fn(),
  createConvexHttpClient: vi.fn(),
  cookies: vi.fn(async () => ({})),
  withRateLimitImpl: vi.fn(<T,>(handler: T) => handler),
}));

vi.mock("next/headers", () => ({
  cookies: () => cookies(),
}));

vi.mock("@/lib/auth/session", () => ({
  getConvexAccessToken: (request?: Request) => getConvexAccessToken(request),
}));

vi.mock("@/lib/convex/http", () => ({
  api: { tax: { listReports: "tax.listReports" } },
  createConvexHttpClient: (token?: string) => createConvexHttpClient(token),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => withRateLimitImpl(handler),
}));

import { GET } from "./route";

function request(url = "http://localhost/api/tax-reports"): NextRequest {
  return new NextRequest(url);
}

describe("GET /api/tax-reports", () => {
  beforeEach(() => {
    getConvexAccessToken.mockReset();
    createConvexHttpClient.mockReset();
    cookies.mockClear();
    withRateLimitImpl.mockImplementation(<T,>(handler: T) => handler);
  });

  it("returns 401 when the session token is missing", async () => {
    getConvexAccessToken.mockResolvedValue(null);
    const res = await GET(request());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createConvexHttpClient).not.toHaveBeenCalled();
  });

  it("returns 200 with an empty list and omits undefined Convex args", async () => {
    const query = vi.fn().mockResolvedValue([]);
    getConvexAccessToken.mockResolvedValue("tok");
    createConvexHttpClient.mockReturnValue({ query });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ reports: [] });
    expect(query).toHaveBeenCalledWith("tax.listReports", {});
  });

  it("forwards only defined filters to Convex", async () => {
    const query = vi.fn().mockResolvedValue([{ id: "r1" }]);
    getConvexAccessToken.mockResolvedValue("tok");
    createConvexHttpClient.mockReturnValue({ query });
    const res = await GET(
      request("http://localhost/api/tax-reports?taxYear=2025&status=draft"),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ reports: [{ id: "r1" }] });
    expect(query).toHaveBeenCalledWith("tax.listReports", {
      taxYear: 2025,
      status: "draft",
    });
  });

  it("retries a transient Convex error once and still returns 200", async () => {
    const query = vi
      .fn()
      .mockRejectedValueOnce(new Error("backend closed connection"))
      .mockResolvedValueOnce([]);
    getConvexAccessToken.mockResolvedValue("tok");
    createConvexHttpClient.mockReturnValue({ query });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ reports: [] });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("returns 200 empty when Convex stays down after retry (auth present)", async () => {
    const query = vi.fn().mockRejectedValue(new Error("Not authenticated"));
    getConvexAccessToken.mockResolvedValue("tok");
    createConvexHttpClient.mockReturnValue({ query });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ reports: [] });
  });

  it("returns 200 empty when the first-request wrapper throws", async () => {
    getConvexAccessToken.mockResolvedValue("tok");
    withRateLimitImpl.mockImplementation(() => {
      return async () => {
        throw new Error("Cannot reconstruct Response after cookies()");
      };
    });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ reports: [] });
  });

  it("returns 200 for concurrent cold first requests", async () => {
    const query = vi.fn().mockResolvedValue([]);
    getConvexAccessToken.mockResolvedValue("tok");
    createConvexHttpClient.mockReturnValue({ query });
    const [first, second] = await Promise.all([GET(request()), GET(request())]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ reports: [] });
    await expect(second.json()).resolves.toEqual({ reports: [] });
  });

  it("rethrows Next.js cookies() control-flow instead of mapping it to 200", async () => {
    const postpone = Object.assign(new Error("Dynamic server usage: cookies"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    cookies.mockRejectedValue(postpone);
    await expect(GET(request())).rejects.toBe(postpone);
  });
});
