/**
 * Failed `?code=` exchange in the Convex Auth proxy
 * ==================================================
 * `convexAuthNextjsMiddleware` (`@convex-dev/auth` 0.0.95) exchanges any
 * `?code=` on an HTML GET itself, before our route handlers run. Both
 * outcomes are a redirect to the same URL with `code` removed:
 *
 * - success: the JWT and refresh token cookies are set to the new tokens
 * - failure: the JWT and refresh token cookies are cleared (empty value,
 *   expired) and the error is only logged on the server
 *
 * So a used or invalid `/auth/callback?code=...` reached `/auth/callback`
 * with no code and ended on plain `/login`. This helper spots the failure
 * branch from the response the library returns, and only that branch, then
 * sends the user to `/login?error=expired_link` instead. The cleared cookie
 * headers are kept. A successful exchange is returned untouched.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loginPathForLinkError } from "@/lib/auth/link-error";

/** Convex Auth JWT cookie names (`__Host-` prefix off localhost). */
const JWT_COOKIE_NAMES = ["__Host-__convexAuthJWT", "__convexAuthJWT"];

/**
 * True when `response` is the library's failed code exchange redirect for
 * `request`: the request carried `?code=`, the response redirects to the
 * same path with `code` removed, and it clears the JWT cookie.
 */
export function isFailedCodeExchange(request: NextRequest, response: Response): boolean {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return false;
  if (response.status < 300 || response.status >= 400) return false;

  const location = response.headers.get("location");
  if (!location) return false;
  let target: URL;
  try {
    target = new URL(location, request.url);
  } catch {
    return false;
  }
  if (target.pathname !== request.nextUrl.pathname) return false;
  if (target.searchParams.has("code")) return false;

  const jwt = jwtCookieValue(response.headers);
  // Success sets a non-empty JWT. Failure sets it to "" to clear it.
  return jwt === "";
}

/** Value of the JWT cookie this response sets, or null when it sets none. */
function jwtCookieValue(headers: Headers): string | null {
  for (const cookie of headers.getSetCookie()) {
    const eq = cookie.indexOf("=");
    if (eq < 0) continue;
    const name = cookie.slice(0, eq).trim();
    if (!JWT_COOKIE_NAMES.includes(name)) continue;
    const end = cookie.indexOf(";", eq);
    return cookie.slice(eq + 1, end < 0 ? undefined : end).trim();
  }
  return null;
}

/**
 * Turn a failed code exchange into a redirect to `/login?error=expired_link`.
 * Any other response is returned as is.
 */
export function redirectFailedCodeExchange<T extends Response | null | undefined | void>(
  request: NextRequest,
  response: T,
): T | NextResponse {
  if (!response || !isFailedCodeExchange(request, response)) return response;
  const headers = new Headers(response.headers);
  headers.set("location", new URL(loginPathForLinkError("expired_link"), request.url).toString());
  return new NextResponse(null, { status: response.status, headers });
}
