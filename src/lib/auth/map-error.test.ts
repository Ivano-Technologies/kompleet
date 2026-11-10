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

describe("mapAuthError", () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("maps a redacted verify Server Error to invalid-or-expired without a Ref or Sentry", () => {
    const result = mapAuthError(
      new Error("[Request ID: xyz] Server Error"),
      "verify",
    );
    expect(result.message).toBe(FRIENDLY_MESSAGES.invalidCode);
    expect(result.known).toBe(true);
    expect(authErrorText(result)).toBe(FRIENDLY_MESSAGES.invalidCode);
    expect(authErrorText(result)).not.toMatch(/Ref:/);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("maps a redacted signup Server Error to account-exists", () => {
    const result = mapAuthError(
      new Error("[Request ID: xyz] Server Error"),
      "signup",
    );
    expect(result.message).toBe(FRIENDLY_MESSAGES.accountExists);
    expect(result.known).toBe(true);
  });

  it("keeps the generic message plus Ref for unexpected errors", () => {
    const result = mapAuthError(new Error("JWT_PRIVATE_KEY is missing"), "verify");
    expect(result.message).toBe(FRIENDLY_FALLBACK);
    expect(result.known).toBe(false);
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
});
