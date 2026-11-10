import { describe, expect, it } from "vitest";
import {
  TOTP_INVALID,
  TWO_FACTOR_REQUIRED,
  isTotpInvalidError,
  isTwoFactorRequiredError,
  secondFactorArgs,
} from "./totp-sign-in";

describe("totp sign-in helpers", () => {
  it("sends a 6-digit value as totpCode", () => {
    expect(secondFactorArgs(" 123 456 ")).toEqual({ totpCode: "123456" });
  });

  it("sends other values as recovery codes", () => {
    expect(secondFactorArgs("AB12-CD34")).toEqual({
      recoveryCode: "AB12-CD34",
    });
  });

  it("omits empty second factors", () => {
    expect(secondFactorArgs("")).toEqual({});
    expect(secondFactorArgs(undefined)).toEqual({});
  });

  it("detects TWO_FACTOR_REQUIRED from ConvexError data", () => {
    const err = {
      name: "ConvexError",
      data: { code: TWO_FACTOR_REQUIRED, message: "Enter the 6-digit code" },
    };
    expect(isTwoFactorRequiredError(err)).toBe(true);
    expect(isTotpInvalidError(err)).toBe(false);
  });

  it("detects invalid TOTP from wrapped messages", () => {
    expect(
      isTotpInvalidError(new Error(`[CONVEX A(auth:signIn)] ${TOTP_INVALID}`)),
    ).toBe(true);
  });
});
