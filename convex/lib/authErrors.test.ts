/** @vitest-environment node */

import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  AUTH_ERROR_CODES,
  classifyAuthError,
  isBlankAuthCode,
  throwAuthError,
  toTypedAuthError,
  withSanitisedAuthCode,
} from "./authErrors";

describe("classifyAuthError", () => {
  it("maps Convex Auth verify/reset throws", () => {
    expect(classifyAuthError(new Error("Could not verify code"))).toBe(
      AUTH_ERROR_CODES.INVALID_CODE,
    );
    expect(classifyAuthError(new Error("Invalid code"))).toBe(
      AUTH_ERROR_CODES.INVALID_CODE,
    );
    expect(classifyAuthError(new Error("Expired verification code"))).toBe(
      AUTH_ERROR_CODES.EXPIRED_CODE,
    );
    expect(classifyAuthError(new Error("TooManyFailedAttempts"))).toBe(
      AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
    );
    expect(classifyAuthError(new Error("Too many attempts"))).toBe(
      AUTH_ERROR_CODES.RATE_LIMITED,
    );
    expect(classifyAuthError(new Error("InvalidAccountId"))).toBe(
      AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    );
    expect(
      classifyAuthError(new Error("Account jane@example.com already exists")),
    ).toBe(AUTH_ERROR_CODES.ACCOUNT_EXISTS);
    expect(classifyAuthError(new Error("column foo does not exist"))).toBeNull();
  });
});

describe("toTypedAuthError", () => {
  it("rethrows known failures as ConvexError with a typed code", () => {
    expect(() => toTypedAuthError(new Error("Could not verify code"))).toThrow(
      ConvexError,
    );
    try {
      toTypedAuthError(new Error("Could not verify code"));
    } catch (error) {
      expect(error).toMatchObject({
        name: "ConvexError",
        data: { code: AUTH_ERROR_CODES.INVALID_CODE },
      });
    }
  });

  it("leaves already-typed ConvexErrors alone", () => {
    try {
      throwAuthError(AUTH_ERROR_CODES.RATE_LIMITED, 47);
    } catch (original) {
      try {
        toTypedAuthError(original);
      } catch (error) {
        expect(error).toBe(original);
      }
    }
  });

  it("passes password rule text through as a ConvexError string", () => {
    try {
      toTypedAuthError(new Error("Password must contain at least one number"));
    } catch (error) {
      expect(error).toMatchObject({
        name: "ConvexError",
        data: "Password must contain at least one number",
      });
    }
  });
});

describe("withSanitisedAuthCode", () => {
  it("keeps a trailing full stop from reaching Convex Auth", () => {
    expect(withSanitisedAuthCode({ code: "85118942.", flow: "email-verification" })).toEqual({
      code: "85118942",
      flow: "email-verification",
    });
    expect(isBlankAuthCode({ code: "...." })).toBe(false);
    expect(isBlankAuthCode(withSanitisedAuthCode({ code: "...." }))).toBe(true);
  });
});
