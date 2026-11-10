import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import { AUTH_ERROR_CODES } from "../../../convex/lib/authErrors";
import { FRIENDLY_FALLBACK, FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import { authErrorText, mapAuthError } from "@/lib/auth/map-error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

class FakeConvexError extends Error {
  data: unknown;
  constructor(data: unknown) {
    super("ConvexError");
    this.name = "ConvexError";
    this.data = data;
  }
}

/** Exact shape the Convex Auth Next.js `/api/auth` proxy throws in the browser. */
function proxiedConvexError(data: object) {
  return new Error(
    `[Request ID: 7f3a9c1e2b] Server Error\nUncaught ConvexError: ${JSON.stringify(data)}`,
  );
}

describe("mapAuthError", () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("maps a redacted verify Server Error to the generic message, reports Sentry, and hides the Ref", () => {
    const result = mapAuthError(
      new Error("[Request ID: xyz] Server Error"),
      "verify",
    );
    expect(result.message).toBe(FRIENDLY_FALLBACK);
    expect(result.known).toBe(false);
    expect(result.hideRef).toBe(true);
    expect(authErrorText(result)).toBe(FRIENDLY_FALLBACK);
    expect(authErrorText(result)).not.toMatch(/Ref:/);
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it("does not treat a redacted signup Server Error as account-exists", () => {
    const result = mapAuthError(
      new Error("[Request ID: xyz] Server Error"),
      "signup",
    );
    expect(result.message).toBe(FRIENDLY_FALLBACK);
    expect(result.message).not.toBe(FRIENDLY_MESSAGES.accountExists);
    expect(result.known).toBe(false);
    expect(result.hideRef).toBe(true);
    expect(authErrorText(result)).not.toMatch(/Ref:/);
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it("keeps the generic message plus Ref for unexpected errors", () => {
    const result = mapAuthError(new Error("JWT_PRIVATE_KEY is missing"), "verify");
    expect(result.message).toBe(FRIENDLY_FALLBACK);
    expect(result.known).toBe(false);
    expect(result.hideRef).toBe(false);
    expect(authErrorText(result)).toMatch(/Ref: [A-Z0-9]{8}$/);
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it("maps a typed RATE_LIMITED ConvexError with wait time", () => {
    const result = mapAuthError(
      new FakeConvexError({
        code: AUTH_ERROR_CODES.RATE_LIMITED,
        retryAfterSeconds: 60,
      }),
      "forgot",
    );
    expect(result.message).toBe(
      "Too many attempts. Please wait a minute and try again.",
    );
    expect(result.known).toBe(true);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("maps ACCOUNT_EXISTS to sign-in-or-reset copy without a Ref", () => {
    const result = mapAuthError(
      new FakeConvexError({ code: AUTH_ERROR_CODES.ACCOUNT_EXISTS }),
      "signup",
    );
    expect(result.message).toBe(FRIENDLY_MESSAGES.accountExists);
    expect(authErrorText(result)).not.toMatch(/Ref:/);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("maps lockout with a one-hour wait", () => {
    const result = mapAuthError(
      new FakeConvexError({
        code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
        retryAfterSeconds: 3600,
      }),
      "reset",
    );
    expect(result.message).toBe(
      "Too many attempts. Please wait an hour and try again.",
    );
    expect(result.known).toBe(true);
  });

  it("maps a typed invalid reset code without a Ref", () => {
    const result = mapAuthError(
      new FakeConvexError({ code: AUTH_ERROR_CODES.INVALID_CODE }),
      "reset",
    );
    expect(result.message).toBe(FRIENDLY_MESSAGES.invalidCode);
    expect(authErrorText(result)).toBe(FRIENDLY_MESSAGES.invalidCode);
  });

  it("parses the real proxy string for all six auth codes including RATE_LIMITED wait time", () => {
    const signup = mapAuthError(
      proxiedConvexError({ code: AUTH_ERROR_CODES.ACCOUNT_EXISTS }),
      "signup",
    );
    expect(signup.message).toBe(FRIENDLY_MESSAGES.accountExists);
    expect(signup.known).toBe(true);
    expect(authErrorText(signup)).not.toMatch(/Ref:/);

    const limited = mapAuthError(
      proxiedConvexError({
        code: AUTH_ERROR_CODES.RATE_LIMITED,
        retryAfterSeconds: 47,
      }),
      "forgot",
    );
    expect(limited.message).toBe(
      "Too many attempts. Please wait 47 seconds and try again.",
    );

    const invalidCode = mapAuthError(
      proxiedConvexError({ code: AUTH_ERROR_CODES.INVALID_CODE }),
      "verify",
    );
    expect(invalidCode.message).toBe(FRIENDLY_MESSAGES.invalidCode);

    const expired = mapAuthError(
      proxiedConvexError({ code: AUTH_ERROR_CODES.EXPIRED_CODE }),
      "reset",
    );
    expect(expired.message).toBe(FRIENDLY_MESSAGES.invalidCode);

    const credentials = mapAuthError(
      proxiedConvexError({ code: AUTH_ERROR_CODES.INVALID_CREDENTIALS }),
      "login",
    );
    expect(credentials.message).toBe(FRIENDLY_MESSAGES.invalidCredentials);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("maps the prod proxy JSON {code} string the browser throws", () => {
    const result = mapAuthError(
      new Error(
        JSON.stringify({ code: AUTH_ERROR_CODES.INVALID_CREDENTIALS }),
      ),
      "login",
    );
    expect(result.message).toBe(FRIENDLY_MESSAGES.invalidCredentials);
    expect(result.known).toBe(true);
    expect(authErrorText(result)).not.toMatch(/Ref:|Request ID/);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("masks login TOO_MANY_ATTEMPTS from the proxy string as doesn't match", () => {
    const result = mapAuthError(
      proxiedConvexError({
        code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
        retryAfterSeconds: 3600,
      }),
      "login",
    );
    expect(result.message).toBe(FRIENDLY_MESSAGES.invalidCredentials);
    expect(result.known).toBe(true);
    expect(authErrorText(result)).not.toMatch(/Ref:|Too many attempts/);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
