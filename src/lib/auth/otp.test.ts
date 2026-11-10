import { describe, expect, it } from "vitest";
import {
  EMAIL_VERIFICATION_MAX_AGE_SECONDS,
  PASSWORD_RESET_MAX_AGE_SECONDS,
} from "../../../convex/lib/authEmail";
import { sanitiseAuthOtp } from "../../../convex/lib/authOtp";
import {
  EMAIL_VERIFICATION_MAX_AGE_MINUTES,
  PASSWORD_RESET_MAX_AGE_MINUTES,
  sanitiseAuthOtp as clientSanitise,
} from "@/lib/auth/otp";

describe("auth OTP helpers", () => {
  it("uses the same sanitiser on client and server", () => {
    expect(clientSanitise("85118942.")).toBe("85118942");
    expect(clientSanitise("85118942.")).toBe(sanitiseAuthOtp("85118942."));
  });

  it("keeps the copy TTLs in lockstep with Convex Auth maxAge", () => {
    expect(EMAIL_VERIFICATION_MAX_AGE_MINUTES * 60).toBe(
      EMAIL_VERIFICATION_MAX_AGE_SECONDS,
    );
    expect(PASSWORD_RESET_MAX_AGE_MINUTES * 60).toBe(
      PASSWORD_RESET_MAX_AGE_SECONDS,
    );
  });
});
