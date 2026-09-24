import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsMiddleware: () => async () =>
    new Response(
      JSON.stringify({
        tokens: { token: "test-token", refreshToken: "dummy" },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
}));

import { GET, POST } from "./route";

const authDir = path.dirname(fileURLToPath(import.meta.url));

describe("POST /api/auth route", () => {
  it("returns Convex Auth JSON instead of HTML", async () => {
    const request = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "auth:signIn",
        args: { email: "a@b.c", password: "secret1", flow: "signUp" },
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await response.json()) as {
      tokens?: { token?: string };
    };
    expect(body.tokens?.token).toBe("test-token");
    const raw = JSON.stringify(body);
    expect(raw.startsWith("<")).toBe(false);
    expect(raw).not.toContain("<!DOCTYPE");
  });

  it("does not treat GET as an HTML page", async () => {
    const request = new Request("http://localhost/api/auth", {
      method: "GET",
    });
    const response = await GET(request as never);
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
  });

  it("is an exact route.ts, not a catch-all that would steal subroutes", () => {
    expect(existsSync(path.join(authDir, "route.ts"))).toBe(true);
    const names = readdirSync(authDir);
    expect(names.some((name) => name.includes("[..."))).toBe(false);
    expect(existsSync(path.join(authDir, "ensure-profile/route.ts"))).toBe(true);
    expect(existsSync(path.join(authDir, "login/route.ts"))).toBe(true);
    expect(existsSync(path.join(authDir, "profile/route.ts"))).toBe(true);
  });
});
