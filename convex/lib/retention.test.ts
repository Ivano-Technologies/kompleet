/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  OTP_PURGE_GRACE_MS,
  isPastExpiry,
  shouldPurgeDeletedUser,
  shouldPurgeInvoice,
} from "./retention";

describe("retention windows", () => {
  it("keeps OTPs until a day after expiry", () => {
    const expiredAt = 1_000;
    expect(isPastExpiry(expiredAt, expiredAt + OTP_PURGE_GRACE_MS - 1, OTP_PURGE_GRACE_MS)).toBe(
      false,
    );
    expect(
      isPastExpiry(expiredAt, expiredAt + OTP_PURGE_GRACE_MS + 1, OTP_PURGE_GRACE_MS),
    ).toBe(true);
  });

  it("purges issued invoices after six years", () => {
    const createdAt = Date.UTC(2018, 0, 1);
    const now = Date.UTC(2025, 0, 2);
    expect(shouldPurgeInvoice({ createdAt }, now)).toBe(true);
    expect(shouldPurgeInvoice({ createdAt: Date.UTC(2024, 0, 1) }, now)).toBe(false);
  });

  it("holds anonymised user rows for 30 days when nothing is left to keep", () => {
    const deletedAt = Date.UTC(2026, 0, 1);
    expect(shouldPurgeDeletedUser({ deletedAt }, 0, Date.UTC(2026, 0, 15))).toBe(
      false,
    );
    expect(shouldPurgeDeletedUser({ deletedAt }, 0, Date.UTC(2026, 1, 15))).toBe(
      true,
    );
    expect(shouldPurgeDeletedUser({ deletedAt }, 2, Date.UTC(2026, 1, 15))).toBe(
      false,
    );
  });
});
