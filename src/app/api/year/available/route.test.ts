/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthedConvex = vi.fn();

vi.mock("@/lib/convex/server", () => ({
  getAuthedConvex: (...args: unknown[]) => getAuthedConvex(...args),
}));

vi.mock("@/lib/convex/http", () => ({
  api: { year: { listMine: "year.listMine" } },
}));

import { GET } from "./route";

function request(): Request {
  return new Request("http://localhost/api/year/available");
}

describe("GET /api/year/available", () => {
  const currentYear = new Date().getFullYear();
  const fallback = [currentYear - 2, currentYear - 1, currentYear];

  beforeEach(() => {
    getAuthedConvex.mockReset();
  });

  it("returns 200 with fallback years when there is no session", async () => {
    getAuthedConvex.mockResolvedValue(null);
    const res = await GET(request() as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ years: fallback });
  });

  it("returns 200 with stored years for an authenticated session", async () => {
    const query = vi.fn().mockResolvedValue([2024, 2025]);
    getAuthedConvex.mockResolvedValue({ convex: { query } });
    const res = await GET(request() as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ years: [2024, 2025] });
    expect(query).toHaveBeenCalledWith("year.listMine", {});
  });

  it("returns 200 with fallback years when the user has none stored", async () => {
    const query = vi.fn().mockResolvedValue([]);
    getAuthedConvex.mockResolvedValue({ convex: { query } });
    const res = await GET(request() as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ years: fallback });
  });

  it("returns 200 with fallback years when Convex throws", async () => {
    const query = vi.fn().mockRejectedValue(new Error("Not authenticated"));
    getAuthedConvex.mockResolvedValue({ convex: { query } });
    const res = await GET(request() as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ years: fallback });
  });
});
