import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { AUTH_ERROR_CODES, type AuthErrorData } from "../../../convex/lib/authErrors";
import { FRIENDLY_FALLBACK, FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import { authErrorText, mapAuthError, type AuthErrorSurface } from "@/lib/auth/map-error";
import {
  AUTH_PROXY_GENERIC_ERROR,
  AUTH_PROXY_INVALID_REQUEST,
  authErrorPayloadFromUnknown,
  authProxyErrorBody,
  authProxyInvalidRequestBody,
  isAuthProxyActionBody,
  safeAuthErrorPayload,
} from "@/lib/auth/proxy-auth-error";

/**
 * Exact reconstruction used by `convex/src/browser/http_client.ts`:
 * `forwardErrorData(errorData, new ConvexError(errorMessage))`.
 * Production Convex replaces the message; structured `.data` is kept.
 */
function prodRedactedConvexError(data: unknown): ConvexError<string> {
  const error = new ConvexError("[Request ID: 7f3a9c1e2b] Server Error");
  (error as { data: unknown }).data = data;
  return error;
}

const ALL_AUTH_CODES: AuthErrorData[] = [
  { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS },
  { code: AUTH_ERROR_CODES.ACCOUNT_EXISTS },
  { code: AUTH_ERROR_CODES.INVALID_CODE },
  { code: AUTH_ERROR_CODES.EXPIRED_CODE },
  { code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS, retryAfterSeconds: 3600 },
  { code: AUTH_ERROR_CODES.RATE_LIMITED, retryAfterSeconds: 47 },
];

const SURFACE_BY_CODE: Record<AuthErrorData["code"], AuthErrorSurface> = {
  INVALID_CREDENTIALS: "login",
  ACCOUNT_EXISTS: "signup",
  INVALID_CODE: "verify",
  EXPIRED_CODE: "reset",
  TOO_MANY_ATTEMPTS: "reset",
  RATE_LIMITED: "forgot",
};

describe("prod redaction: ConvexError.data survives, message does not", () => {
  it("matches the Convex HTTP client reconstruction", () => {
    const error = prodRedactedConvexError({
      code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    });
    expect(error).toBeInstanceOf(ConvexError);
    expect(error.name).toBe("ConvexError");
    expect(error.message).toBe("[Request ID: 7f3a9c1e2b] Server Error");
    expect(error.message).not.toMatch(/INVALID_CREDENTIALS|Uncaught ConvexError/);
    expect(error.data).toEqual({ code: AUTH_ERROR_CODES.INVALID_CREDENTIALS });
  });

  it.each(ALL_AUTH_CODES)(
    "forwards only a safe payload for %j when the message is redacted",
    (data) => {
      const error = prodRedactedConvexError({
        ...data,
        secret: "do-not-forward",
        stack: "Error: boom\n    at throwAuthError",
      });
      const payload = authErrorPayloadFromUnknown(error);
      expect(payload).toEqual(safeAuthErrorPayload(data));
      expect(payload).not.toHaveProperty("secret");
      expect(payload).not.toHaveProperty("stack");

      const body = authProxyErrorBody(error);
      expect(body.code).toBe(data.code);
      expect(JSON.parse(body.error)).toEqual(safeAuthErrorPayload(data));
      expect(body.error).not.toMatch(/Request ID|Server Error|throwAuthError|secret|do-not-forward/);
    },
  );

  it("maps every forwarded prod-redacted code the way the client mapper does", () => {
    for (const data of ALL_AUTH_CODES) {
      const body = authProxyErrorBody(prodRedactedConvexError(data));
      const thrown = new Error(body.error);
      const surface = SURFACE_BY_CODE[data.code];
      const result = mapAuthError(thrown, surface);
      expect(result.known).toBe(true);
      expect(result.hideRef).toBe(true);
      expect(authErrorText(result)).not.toMatch(/Ref:|Request ID|Server Error/);
      switch (data.code) {
        case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
          expect(result.message).toBe(FRIENDLY_MESSAGES.invalidCredentials);
          break;
        case AUTH_ERROR_CODES.ACCOUNT_EXISTS:
          expect(result.message).toBe(FRIENDLY_MESSAGES.accountExists);
          break;
        case AUTH_ERROR_CODES.INVALID_CODE:
        case AUTH_ERROR_CODES.EXPIRED_CODE:
          expect(result.message).toBe(FRIENDLY_MESSAGES.invalidCode);
          break;
        case AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS:
          expect(result.message).toBe(
            "Too many attempts. Please wait an hour and try again.",
          );
          break;
        case AUTH_ERROR_CODES.RATE_LIMITED:
          expect(result.message).toBe(
            "Too many attempts. Please wait 47 seconds and try again.",
          );
          break;
        default: {
          const _exhaustive: never = data.code;
          throw new Error(`unhandled ${_exhaustive}`);
        }
      }
    }
  });

  it("masks login lockout as doesn't match after prod redaction", () => {
    const body = authProxyErrorBody(
      prodRedactedConvexError({
        code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
        retryAfterSeconds: 3600,
      }),
    );
    const result = mapAuthError(new Error(body.error), "login");
    expect(result.message).toBe(FRIENDLY_MESSAGES.invalidCredentials);
    expect(authErrorText(result)).not.toMatch(/Too many attempts|Ref:/);
  });

  it("does not leak a redacted message or stack when .data is not an auth code", () => {
    const error = prodRedactedConvexError({ internals: "user-row-id-123" });
    const body = authProxyErrorBody(error);
    expect(body).toEqual({ error: AUTH_PROXY_GENERIC_ERROR });
    expect(body.error).toBe(FRIENDLY_FALLBACK);
    expect(JSON.stringify(body)).not.toMatch(
      /Request ID|user-row-id|internals|Server Error/,
    );
  });
});

describe("authProxyErrorBody", () => {
  it("normalises a dev Uncaught ConvexError string to the same {code} JSON", () => {
    const error = new Error(
      `[Request ID: 7f3a9c1e2b] Server Error\nUncaught ConvexError: {"code":"ACCOUNT_EXISTS"}\n    at throwAuthError (../../convex/lib/authErrors.ts:98:9)`,
    );
    expect(authProxyErrorBody(error)).toEqual({
      error: JSON.stringify({ code: AUTH_ERROR_CODES.ACCOUNT_EXISTS }),
      code: AUTH_ERROR_CODES.ACCOUNT_EXISTS,
    });
  });

  it("forwards allowlisted password-rule text from ConvexError.data", () => {
    const error = prodRedactedConvexError(
      "Password must contain at least one number",
    );
    expect(authProxyErrorBody(error)).toEqual({
      error: "Password must contain at least one number",
    });
  });

  it("does not forward an arbitrary ConvexError string", () => {
    const error = prodRedactedConvexError("users.email already exists for jane@x");
    expect(authProxyErrorBody(error)).toEqual({
      error: AUTH_PROXY_GENERIC_ERROR,
    });
  });
});

describe("isAuthProxyActionBody", () => {
  it("accepts the Convex Auth client shape", () => {
    expect(
      isAuthProxyActionBody({
        action: "auth:signIn",
        args: { email: "a@b.c", flow: "signIn" },
      }),
    ).toBe(true);
  });

  it("keeps Invalid request when sanitising that already-safe body", () => {
    expect(authProxyErrorBody(new Error(AUTH_PROXY_INVALID_REQUEST))).toEqual({
      error: AUTH_PROXY_INVALID_REQUEST,
    });
  });

  it("rejects empty, null, and malformed bodies", () => {
    expect(isAuthProxyActionBody(null)).toBe(false);
    expect(isAuthProxyActionBody(undefined)).toBe(false);
    expect(isAuthProxyActionBody("")).toBe(false);
    expect(isAuthProxyActionBody({})).toBe(false);
    expect(isAuthProxyActionBody({ args: {} })).toBe(false);
    expect(authProxyInvalidRequestBody()).toEqual({
      error: AUTH_PROXY_INVALID_REQUEST,
    });
  });
});
