import { describe, expect, it } from "vitest";
import {
  EMAIL_VERIFICATION_REQUIRED_AFTER_MS,
  isCompatEmailVerified,
} from "./email-verified";

describe("isCompatEmailVerified", () => {
  it("accepts a confirmed timestamp after epoch", () => {
    expect(
      isCompatEmailVerified({
        email_confirmed_at: "2026-11-09T18:00:00.000Z",
        created_at: new Date(EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 1).toISOString(),
      }),
    ).toBe(true);
  });

  it("grandfathers accounts created before the cutoff", () => {
    expect(
      isCompatEmailVerified({
        email_confirmed_at: "",
        created_at: new Date(EMAIL_VERIFICATION_REQUIRED_AFTER_MS - 1).toISOString(),
      }),
    ).toBe(true);
  });

  it("rejects new accounts that have not verified", () => {
    expect(
      isCompatEmailVerified({
        email_confirmed_at: new Date(0).toISOString(),
        created_at: new Date(EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 1).toISOString(),
      }),
    ).toBe(false);
  });
});
