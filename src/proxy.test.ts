// @vitest-environment node
/**
 * Runs requests through the real `src/proxy.ts`, which wraps the real
 * `convexAuthNextjsMiddleware` from `@convex-dev/auth`. Only the Convex
 * `signIn` action (`fetchAction`) and the Next request context
 * (`next/headers`) are mocked.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextFetchEvent } from "next/server";

const { fetchAction, requestContext } = vi.hoisted(() => ({
  fetchAction: vi.fn(),
  requestContext: { current: null as NextRequest | null },
}));

vi.mock("server-only", () => ({}));

vi.mock("convex/nextjs", () => ({
  fetchAction,
  fetchQuery: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: async () => requestContext.current!.headers,
  cookies: async () => requestContext.current!.cookies,
}));

import proxy from "./proxy";

const ORIGIN = "https://kompleet.test";
const JWT = "__Host-__convexAuthJWT";
const REFRESH = "__Host-__convexAuthRefreshToken";

async function run(path: string): Promise<Response> {
  const request = new NextRequest(`${ORIGIN}${path}`, {
    headers: { accept: "text/html,application/xhtml+xml", host: "kompleet.test" },
  });
  requestContext.current = request;
  const response = await proxy(request, {} as NextFetchEvent);
  return response as Response;
}

/** Follow middleware redirects the way a browser would, up to `max` hops. */
async function follow(path: string, max = 5): Promise<{ hops: Response[]; final: URL }> {
  const hops: Response[] = [];
  let url = new URL(path, ORIGIN);
  for (let i = 0; i < max; i++) {
    const response = await run(`${url.pathname}${url.search}`);
    hops.push(response);
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) break;
    url = new URL(location, url);
  }
  return { hops, final: url };
}

function setCookie(response: Response, name: string): string | undefined {
  return response.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));
}

describe("proxy: ?code= exchange", () => {
  beforeEach(() => {
    fetchAction.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    requestContext.current = null;
  });

  it("sends a failed code exchange on /auth/callback to /login?error=expired_link", async () => {
    fetchAction.mockRejectedValue(new Error("Invalid verification code"));

    const response = await run("/auth/callback?code=bogus123");

    expect(fetchAction).toHaveBeenCalledWith(
      "auth:signIn",
      expect.objectContaining({ params: { code: "bogus123" } }),
      expect.anything(),
    );
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.origin).toBe(ORIGIN);
    expect(location.pathname).toBe("/login");
    expect(location.search).toBe("?error=expired_link");
    // The library's cleared auth cookies are kept.
    expect(setCookie(response, JWT)).toMatch(/^__Host-__convexAuthJWT=;/);
    expect(setCookie(response, REFRESH)).toMatch(/^__Host-__convexAuthRefreshToken=;/);

    // Following the redirect lands on the login page with the error kept.
    const { final } = await follow("/auth/callback?code=bogus123");
    expect(`${final.pathname}${final.search}`).toBe("/login?error=expired_link");
  });

  it("keeps the success redirect and sets the auth cookies on a valid code exchange", async () => {
    fetchAction.mockResolvedValue({
      tokens: { token: "jwt-abc", refreshToken: "refresh-xyz" },
    });

    const response = await run("/auth/callback?code=good456&next=%2Fdashboard");

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    // Same redirect as the library: same URL with only `code` removed.
    expect(location.pathname).toBe("/auth/callback");
    expect(location.search).toBe("?next=%2Fdashboard");
    expect(setCookie(response, JWT)).toMatch(/^__Host-__convexAuthJWT=jwt-abc;/);
    expect(setCookie(response, REFRESH)).toMatch(/^__Host-__convexAuthRefreshToken=refresh-xyz;/);
  });

  it("treats a signIn result without tokens as a failed exchange", async () => {
    fetchAction.mockResolvedValue({});
    const response = await run("/auth/callback?code=used789");
    expect(new URL(response.headers.get("location") ?? "").search).toBe("?error=expired_link");
  });

  it("leaves requests without ?code= alone", async () => {
    const response = await run("/login?error=expired_link");
    expect(fetchAction).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("proxy: theme-shot harness", () => {
  const previousVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    fetchAction.mockReset();
  });
  afterEach(() => {
    if (previousVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = previousVercelEnv;
    }
    requestContext.current = null;
  });

  it("404s /dev/theme-shots when VERCEL_ENV is production", async () => {
    process.env.VERCEL_ENV = "production";
    const response = await run("/dev/theme-shots/dashboard");
    expect(response.status).toBe(404);
    expect(fetchAction).not.toHaveBeenCalled();
  });

  it("lets /dev/theme-shots through outside production", async () => {
    const response = await run("/dev/theme-shots/dashboard");
    expect(response.status).not.toBe(404);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
