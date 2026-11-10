/** @vitest-environment node */

import { afterEach, describe, expect, it } from "vitest";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  hashRecoveryCode,
  totpEncryptionConfigured,
} from "./totpCrypto";

describe("totpCrypto", () => {
  afterEach(() => {
    delete process.env.TOTP_ENCRYPTION_KEY;
  });

  it("is inactive when the env key is absent", () => {
    delete process.env.TOTP_ENCRYPTION_KEY;
    expect(totpEncryptionConfigured()).toBe(false);
  });

  it("round-trips a TOTP secret", async () => {
    process.env.TOTP_ENCRYPTION_KEY = "unit-test-totp-key";
    const packed = await encryptTotpSecret("JBSWY3DPEHPK3PXP");
    expect(packed).not.toContain("JBSWY3DPEHPK3PXP");
    expect(await decryptTotpSecret(packed)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("hashes recovery codes with HMAC so the plaintext is not stored", async () => {
    process.env.TOTP_ENCRYPTION_KEY = "unit-test-totp-key";
    const hash = await hashRecoveryCode("ABCD1234");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("ABCD");
    expect(await hashRecoveryCode("ABCD1234")).toBe(hash);
  });
});
