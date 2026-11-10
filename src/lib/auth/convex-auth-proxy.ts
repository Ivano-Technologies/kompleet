/**
 * Convex Auth POST `/api/auth` proxy that forwards typed auth codes.
 *
 * `@convex-dev/auth` serialises `fetchAction` failures as
 * `{ error: error.message }`. Production Convex redacts that message, so we
 * catch here, read `ConvexError.data` (not redacted), and return a safe
 * `{code}` JSON string the browser client throws as `new Error(body.error)`.
 */
import { fetchAction } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { isExactConvexAuthProxyPath } from "@/lib/auth/convex-auth-api-route";
import {
  authProxyErrorBody,
  authProxyInvalidRequestBody,
  isAuthProxyActionBody,
} from "@/lib/auth/proxy-auth-error";

type AuthProxyArgs = {
  refreshToken?: unknown;
  params?: { code?: unknown };
} & Record<string, unknown>;

function isLocalHost(host?: string): boolean {
  return /(localhost|127\.0\.0\.1):\d+/.test(host ?? "");
}

function cookieNames(host: string | null): {
  token: string;
  refreshToken: string;
  verifier: string;
} {
  const prefix = isLocalHost(host ?? "") ? "" : "__Host-";
  return {
    token: `${prefix}__convexAuthJWT`,
    refreshToken: `${prefix}__convexAuthRefreshToken`,
    verifier: `${prefix}__convexAuthOAuthVerifier`,
  };
}

function cookieOptions(host: string | null): {
  secure: boolean;
  httpOnly: true;
  sameSite: "lax";
  path: "/";
} {
  return {
    secure: !isLocalHost(host ?? ""),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  };
}

function jsonResponse(body: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function isCorsRequest(request: NextRequest): boolean {
  const origin = request.headers.get("Origin");
  const originURL = origin ? new URL(origin) : null;
  return (
    originURL !== null &&
    (originURL.host !== request.headers.get("Host") ||
      originURL.protocol !== new URL(request.url).protocol)
  );
}

function readCookie(request: NextRequest, name: string): string | null {
  const fromStore = request.cookies?.get?.(name)?.value;
  if (fromStore != null && fromStore !== "") return fromStore;
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) === name) {
      return trimmed.slice(eq + 1) || null;
    }
  }
  return null;
}

function setCookie(
  response: NextResponse,
  name: string,
  value: string | null,
  host: string | null,
): void {
  const options = cookieOptions(host);
  if (value === null) {
    response.cookies.set(name, "", {
      ...options,
      maxAge: undefined,
      expires: 0,
    });
    return;
  }
  response.cookies.set(name, value, options);
}

function setAuthCookies(
  response: NextResponse,
  tokens: { token: string; refreshToken: string } | null,
  host: string | null,
): void {
  const names = cookieNames(host);
  if (tokens === null) {
    setCookie(response, names.token, null, host);
    setCookie(response, names.refreshToken, null, host);
  } else {
    setCookie(response, names.token, tokens.token, host);
    setCookie(response, names.refreshToken, tokens.refreshToken, host);
  }
  setCookie(response, names.verifier, null, host);
}

async function readJsonBody(
  request: NextRequest,
): Promise<
  { ok: true; body: { action: string; args: AuthProxyArgs } } | { ok: false }
> {
  let parsed: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) return { ok: false };
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false };
  }
  if (!isAuthProxyActionBody(parsed)) return { ok: false };
  const args =
    parsed.args && typeof parsed.args === "object"
      ? (parsed.args as AuthProxyArgs)
      : {};
  return { ok: true, body: { action: parsed.action, args } };
}

function asNextRequest(request: NextRequest | Request): NextRequest {
  return request instanceof NextRequest
    ? request
    : new NextRequest(request.url, request);
}

export async function proxyAuthActionToConvex(
  request: NextRequest | Request,
): Promise<Response> {
  const nextRequest = asNextRequest(request);
  const host = nextRequest.headers.get("Host");
  if (nextRequest.method !== "POST") {
    return new Response("Invalid method", { status: 405 });
  }
  if (isCorsRequest(nextRequest)) {
    return new Response("Invalid origin", { status: 403 });
  }

  const parsed = await readJsonBody(nextRequest);
  if (!parsed.ok) {
    return jsonResponse(authProxyInvalidRequestBody(), 400);
  }
  const { action, args } = parsed.body;
  if (action !== "auth:signIn" && action !== "auth:signOut") {
    return new Response("Invalid action", { status: 400 });
  }

  const names = cookieNames(host);
  let token: string | undefined;
  if (action === "auth:signIn" && args.refreshToken !== undefined) {
    const refreshToken = readCookie(nextRequest, names.refreshToken);
    if (refreshToken === null) {
      console.error(
        "Convex Auth: Unexpected missing refreshToken cookie during client refresh",
      );
      return jsonResponse({ tokens: null });
    }
    args.refreshToken = refreshToken;
  } else {
    token = readCookie(nextRequest, names.token) ?? undefined;
  }

  if (action === "auth:signIn") {
    const fetchActionAuthOptions =
      args.refreshToken !== undefined || args.params?.code !== undefined
        ? {}
        : { token };
    let result: {
      redirect?: string;
      verifier?: string;
      tokens?: { token: string; refreshToken: string } | null;
    };
    try {
      result = (await fetchAction(
        action as never,
        args as never,
        fetchActionAuthOptions,
      )) as typeof result;
    } catch (error) {
      console.error(`Hit error while running \`auth:signIn\`:`);
      console.error(error);
      const response = jsonResponse(authProxyErrorBody(error), 400);
      setAuthCookies(response, null, host);
      return response;
    }
    if (result.redirect !== undefined) {
      const response = jsonResponse({ redirect: result.redirect });
      setCookie(response, names.verifier, result.verifier ?? null, host);
      return response;
    }
    if (result.tokens !== undefined) {
      const response = jsonResponse({
        tokens:
          result.tokens !== null
            ? { token: result.tokens.token, refreshToken: "dummy" }
            : null,
      });
      setAuthCookies(response, result.tokens, host);
      return response;
    }
    return jsonResponse(result);
  }

  try {
    await fetchAction(action as never, args as never, { token });
  } catch (error) {
    console.error(`Hit error while running \`auth:signOut\`:`);
    console.error(error);
  }
  const response = jsonResponse(null);
  setAuthCookies(response, null, host);
  return response;
}

export async function handleConvexAuthProxy(
  request: NextRequest | Request,
): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (!isExactConvexAuthProxyPath(pathname)) {
    return jsonResponse({ error: "Not found" }, 404);
  }
  return proxyAuthActionToConvex(request);
}
