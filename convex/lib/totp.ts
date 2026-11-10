import { ConvexError } from "convex/values";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  hashRecoveryCode,
  totpEncryptionConfigured,
} from "./totpCrypto";

export const TOTP_ISSUER = "Kompleet";
export const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_WINDOW = 1;
export const RECOVERY_CODE_COUNT = 10;
export const TOTP_MAX_FAILURES = 8;
export const TOTP_FAILURE_WINDOW_MS = 15 * 60 * 1000;

export const TWO_FACTOR_REQUIRED = "TWO_FACTOR_REQUIRED";
export const TOTP_INVALID = "TOTP_INVALID";
export const TOTP_UNAVAILABLE = "Authenticator setup is not available on this deployment.";
export const TOTP_REQUIRED_MESSAGE =
  "Enter the 6-digit code from your authenticator app.";
export const TOTP_INVALID_MESSAGE =
  "That authenticator code doesn't match. Try again.";
export const TOTP_LOCKED_MESSAGE =
  "Too many authenticator attempts. Please wait a moment and try again.";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type TotpFactorState = {
  encryptedSecret: string;
  enabled: boolean;
  pending: boolean;
  recoveryCodeHashes: string[];
  failedCount: number;
  windowStartedAt: number;
};

export function throwTotpError(
  code: typeof TWO_FACTOR_REQUIRED | typeof TOTP_INVALID | "TOTP_LOCKED",
): never {
  const message =
    code === TWO_FACTOR_REQUIRED
      ? TOTP_REQUIRED_MESSAGE
      : code === TOTP_INVALID
        ? TOTP_INVALID_MESSAGE
        : TOTP_LOCKED_MESSAGE;
  throw new ConvexError({ code, message });
}

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/=+$/g, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

export function otpauthUri(email: string, secret: string): string {
  const label = encodeURIComponent(`${TOTP_ISSUER}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer: TOTP_ISSUER,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function totpAt(secret: string, unixSeconds: number): Promise<string> {
  const decoded = base32Decode(secret);
  const keyBytes = new Uint8Array(decoded.byteLength);
  keyBytes.set(decoded);
  const counter = Math.floor(unixSeconds / TOTP_PERIOD_SECONDS);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, buf));
  const offset = sig[sig.length - 1]! & 0x0f;
  const bin =
    ((sig[offset]! & 0x7f) << 24) |
    ((sig[offset + 1]! & 0xff) << 16) |
    ((sig[offset + 2]! & 0xff) << 8) |
    (sig[offset + 3]! & 0xff);
  const otp = bin % 10 ** TOTP_DIGITS;
  return String(otp).padStart(TOTP_DIGITS, "0");
}

export async function verifyTotp(
  secret: string,
  code: string,
  nowMs = Date.now(),
): Promise<boolean> {
  const trimmed = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(trimmed)) return false;
  const unix = Math.floor(nowMs / 1000);
  for (let window = -TOTP_WINDOW; window <= TOTP_WINDOW; window += 1) {
    const expected = await totpAt(secret, unix + window * TOTP_PERIOD_SECONDS);
    if (timingSafeEqual(expected, trimmed)) return true;
  }
  return false;
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const chars = Array.from(
      bytes,
      (byte) => RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length]!,
    );
    codes.push(`${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`);
  }
  return codes;
}

export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function extractTotpParams(params: Record<string, unknown>): {
  totpCode?: string;
  recoveryCode?: string;
} {
  const totpCode =
    typeof params.totpCode === "string" ? params.totpCode.trim() : "";
  const recoveryCode =
    typeof params.recoveryCode === "string" ? params.recoveryCode.trim() : "";
  return {
    ...(totpCode ? { totpCode } : {}),
    ...(recoveryCode ? { recoveryCode } : {}),
  };
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  const hashes: string[] = [];
  for (const code of codes) {
    hashes.push(await hashRecoveryCode(normalizeRecoveryCode(code)));
  }
  return hashes;
}

export type TotpCheckResult =
  | { status: "skipped" }
  | { status: "ok"; consumedRecoveryHash?: string }
  | { status: "failed"; failedCount: number; windowStartedAt: number };

export async function checkTotpFactor(args: {
  factor: TotpFactorState | null;
  totpCode?: string;
  recoveryCode?: string;
  nowMs?: number;
}): Promise<TotpCheckResult> {
  const factor = args.factor;
  if (!factor || !factor.enabled) {
    return { status: "skipped" };
  }
  if (!totpEncryptionConfigured()) {
    throw new ConvexError({
      code: "TOTP_UNAVAILABLE",
      message:
        "Two-factor verification is temporarily unavailable. Contact support.",
    });
  }

  const now = args.nowMs ?? Date.now();
  let failedCount = factor.failedCount;
  let windowStartedAt = factor.windowStartedAt;
  if (now - windowStartedAt > TOTP_FAILURE_WINDOW_MS) {
    failedCount = 0;
    windowStartedAt = now;
  }
  if (failedCount >= TOTP_MAX_FAILURES) {
    throwTotpError("TOTP_LOCKED");
  }

  const totpCode = args.totpCode?.trim() ?? "";
  const recoveryCode = args.recoveryCode?.trim() ?? "";
  if (!totpCode && !recoveryCode) {
    throwTotpError(TWO_FACTOR_REQUIRED);
  }

  if (totpCode) {
    const secret = await decryptTotpSecret(factor.encryptedSecret);
    if (await verifyTotp(secret, totpCode, now)) {
      return { status: "ok" };
    }
  }

  if (recoveryCode) {
    const hashed = await hashRecoveryCode(normalizeRecoveryCode(recoveryCode));
    if (factor.recoveryCodeHashes.includes(hashed)) {
      return { status: "ok", consumedRecoveryHash: hashed };
    }
  }

  return {
    status: "failed",
    failedCount: failedCount + 1,
    windowStartedAt,
  };
}

export async function encryptNewSecret(secret: string): Promise<string> {
  return encryptTotpSecret(secret);
}

export { totpEncryptionConfigured };
