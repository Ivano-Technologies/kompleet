/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  TOTP_DIGITS,
  TOTP_INVALID,
  TWO_FACTOR_REQUIRED,
  base32Encode,
  checkTotpFactor,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCodes,
  normalizeRecoveryCode,
  otpauthUri,
  totpAt,
  verifyTotp,
} from "./totp";
import { encryptTotpSecret, hashRecoveryCode } from "./totpCrypto";

const RFC_SECRET_BYTES = new TextEncoder().encode("12345678901234567890");
const RFC_SECRET_B32 = base32Encode(RFC_SECRET_BYTES);

describe("TOTP", () => {
  beforeEach(() => {
    process.env.TOTP_ENCRYPTION_KEY = "test-totp-encryption-key-please";
  });
  afterEach(() => {
    delete process.env.TOTP_ENCRYPTION_KEY;
  });

  it("matches RFC 6238 SHA-1 6-digit vector at t=59", async () => {
    expect(RFC_SECRET_B32).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(await totpAt(RFC_SECRET_B32, 59)).toBe("287082");
  });

  it("accepts codes in the ±1 period window", async () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    const code = await totpAt(secret, Math.floor(now / 1000) - 30);
    expect(await verifyTotp(secret, code, now)).toBe(true);
    expect(await verifyTotp(secret, "000000", now)).toBe(false);
  });

  it("builds a Kompleet otpauth URI", () => {
    const uri = otpauthUri("ada@example.com", "MFRGGZDF");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("issuer=Kompleet");
    expect(uri).toContain(`digits=${TOTP_DIGITS}`);
  });

  it("hashes recovery codes and consumes a match", async () => {
    const codes = generateRecoveryCodes(2);
    expect(codes).toHaveLength(2);
    expect(codes[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    const hashes = await hashRecoveryCodes(codes);
    const encryptedSecret = await encryptTotpSecret(generateTotpSecret());
    const ok = await checkTotpFactor({
      factor: {
        encryptedSecret,
        enabled: true,
        pending: false,
        recoveryCodeHashes: hashes,
        failedCount: 0,
        windowStartedAt: Date.now(),
      },
      recoveryCode: codes[0]!.toLowerCase(),
    });
    expect(ok).toEqual({
      status: "ok",
      consumedRecoveryHash: await hashRecoveryCode(
        normalizeRecoveryCode(codes[0]!),
      ),
    });
  });

  it("requires a second factor when 2FA is enabled", async () => {
    const encryptedSecret = await encryptTotpSecret(generateTotpSecret());
    try {
      await checkTotpFactor({
        factor: {
          encryptedSecret,
          enabled: true,
          pending: false,
          recoveryCodeHashes: [],
          failedCount: 0,
          windowStartedAt: Date.now(),
        },
      });
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toMatchObject({
        name: "ConvexError",
        data: { code: TWO_FACTOR_REQUIRED },
      });
    }
  });

  it("skips the check when 2FA is off", async () => {
    const result = await checkTotpFactor({ factor: null });
    expect(result).toEqual({ status: "skipped" });
  });

  it("returns failed after a wrong code so callers can persist lockout", async () => {
    const encryptedSecret = await encryptTotpSecret(generateTotpSecret());
    const result = await checkTotpFactor({
      factor: {
        encryptedSecret,
        enabled: true,
        pending: false,
        recoveryCodeHashes: [],
        failedCount: 2,
        windowStartedAt: Date.now(),
      },
      totpCode: "000000",
    });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.failedCount).toBe(3);
    }
    expect(TOTP_INVALID).toBe("TOTP_INVALID");
  });
});
