/**
 * AES-GCM wrapping for TOTP secrets and HMAC hashing for recovery codes.
 * Gated on TOTP_ENCRYPTION_KEY: when the env var is absent, 2FA enrollment
 * is unavailable and sign-in is unchanged.
 */

const encoder = new TextEncoder();

export function totpEncryptionKeyRaw(): string | null {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function totpEncryptionConfigured(): boolean {
  return totpEncryptionKeyRaw() !== null;
}

async function keyMaterial(): Promise<ArrayBuffer> {
  const raw = totpEncryptionKeyRaw();
  if (!raw) {
    throw new Error("TOTP_ENCRYPTION_KEY is not set");
  }
  return crypto.subtle.digest("SHA-256", encoder.encode(raw));
}

async function aesKey(usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    await keyMaterial(),
    "AES-GCM",
    false,
    usage,
  );
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function b64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Encrypt a TOTP secret. Ciphertext is base64(iv || ciphertext+tag). */
export async function encryptTotpSecret(plain: string): Promise<string> {
  const key = await aesKey(["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(plain),
    ),
  );
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return bytesToB64(packed);
}

export async function decryptTotpSecret(packed: string): Promise<string> {
  const bytes = b64ToBytes(packed);
  if (bytes.length < 13) {
    throw new Error("Invalid TOTP ciphertext");
  }
  const iv = bytes.slice(0, 12);
  const cipher = bytes.slice(12);
  const key = await aesKey(["decrypt"]);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipher,
  );
  return new TextDecoder().decode(plain);
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    await keyMaterial(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(`recovery:${code}`)),
  );
  return bytesToHex(sig);
}
