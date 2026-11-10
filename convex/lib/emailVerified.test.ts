/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  EMAIL_VERIFICATION_REQUIRED_AFTER_MS,
  isEmailVerified,
} from "./emailVerified";

describe("isEmailVerified", () => {
  it("treats a set emailVerificationTime as verified", () => {
    expect(
      isEmailVerified({
        emailVerificationTime: EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 1,
        createdAt: EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 1,
      }),
    ).toBe(true);
  });

  it("grandfathers accounts created before verification was required", () => {
    expect(
      isEmailVerified({
        createdAt: EMAIL_VERIFICATION_REQUIRED_AFTER_MS - 1,
      }),
    ).toBe(true);
  });

  it("requires OTP for accounts created after the cutoff", () => {
    expect(
      isEmailVerified({
        createdAt: EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 1,
      }),
    ).toBe(false);
  });
});
