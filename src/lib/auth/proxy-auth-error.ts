/**
 * Map a Convex Auth `fetchAction` throw to a JSON body that is safe to send
 * to the browser.
 *
 * Production Convex redacts thrown `ConvexError.message` to
 * `[Request ID] Server Error` but leaves structured `.data` intact. The
 * `@convex-dev/auth` Next.js proxy otherwise forwards only `.message`, so
 * the client mapper never sees the code. The browser client then does
 * `throw new Error(body.error)`, so the code must live in `error` as JSON.
 *
 * Kept local so Edge `src/proxy.ts` does not import `friendly-error` (Sentry).
 */
import {
  isAuthErrorData,
  retryAfterSecondsFromData,
  type AuthErrorData,
} from "../../../convex/lib/authErrors";

export const AUTH_PROXY_GENERIC_ERROR =
  "Something went wrong. Please try again.";
export const AUTH_PROXY_INVALID_REQUEST = "Invalid request";

const PASSWORD_RULE_PATTERN = /^password (must|should)\b[^\n]{0,120}$/i;

export type AuthProxyErrorBody = {
  error: string;
  code?: AuthErrorData["code"];
};

function convexErrorData(error: unknown): unknown {
  if (!error || typeof error !== "object" || !("data" in error)) return undefined;
  return (error as { data: unknown }).data;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

/** JSON object after `ConvexError:` (dev / unredacted proxy strings). */
function extractConvexErrorJson(text: string): unknown | null {
  const label = text.search(/ConvexError:\s*/);
  if (label < 0) return null;
  const start = text.indexOf("{", label);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1)) as unknown;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function parseJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

export function authErrorPayloadFromUnknown(
  error: unknown,
): AuthErrorData | null {
  const data = convexErrorData(error);
  if (isAuthErrorData(data)) return safeAuthErrorPayload(data);

  const message = errorMessage(error);
  const fromLabel = extractConvexErrorJson(message);
  if (isAuthErrorData(fromLabel)) return safeAuthErrorPayload(fromLabel);
  const parsed = parseJsonObject(message);
  if (isAuthErrorData(parsed)) return safeAuthErrorPayload(parsed);
  return null;
}

/** Only `code` and optional wait time — never extra fields from `.data`. */
export function safeAuthErrorPayload(data: AuthErrorData): AuthErrorData {
  const retryAfterSeconds = retryAfterSecondsFromData(data);
  return retryAfterSeconds != null
    ? { code: data.code, retryAfterSeconds }
    : { code: data.code };
}

function isSafeDeliberateAuthString(text: string): boolean {
  return PASSWORD_RULE_PATTERN.test(text) || text === "Email is required";
}

/**
 * Body for a 400 `/api/auth` response. `error` is always a string because
 * `@convex-dev/auth/nextjs` does `throw new Error(body.error)`.
 */
export function authProxyErrorBody(error: unknown): AuthProxyErrorBody {
  const payload = authErrorPayloadFromUnknown(error);
  if (payload) {
    return { error: JSON.stringify(payload), code: payload.code };
  }
  const data = convexErrorData(error);
  if (typeof data === "string" && isSafeDeliberateAuthString(data)) {
    return { error: data };
  }
  const message = errorMessage(error);
  if (
    message === AUTH_PROXY_INVALID_REQUEST ||
    message === AUTH_PROXY_GENERIC_ERROR ||
    isSafeDeliberateAuthString(message)
  ) {
    return { error: message };
  }
  return { error: AUTH_PROXY_GENERIC_ERROR };
}

export function authProxyInvalidRequestBody(): AuthProxyErrorBody {
  return { error: AUTH_PROXY_INVALID_REQUEST };
}

export function isAuthProxyActionBody(
  body: unknown,
): body is { action: string; args?: unknown } {
  return (
    !!body &&
    typeof body === "object" &&
    typeof (body as { action?: unknown }).action === "string" &&
    (body as { action: string }).action.length > 0
  );
}
