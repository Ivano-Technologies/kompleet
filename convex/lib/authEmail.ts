export const DEFAULT_AUTH_EMAIL_FROM = "Kompleet <noreply@techivano.com>";

export const EMAIL_VERIFICATION_MAX_AGE_SECONDS = 60 * 15;
export const PASSWORD_RESET_MAX_AGE_SECONDS = 60 * 60;

export function generateNumericCode(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => String(byte % 10)).join("");
}

/**
 * Convex Auth looks up OTPs with `.unique()` on the SHA-256 of the code.
 * Codes must be unique across outstanding rows, including isolated CI.
 * AUTH_E2E_OTP is a read secret for the CI store, never the code itself.
 */
export function generateAuthOtp(): string {
  return generateNumericCode(8);
}

/**
 * Isolated CI Convex has no Resend key. AUTH_E2E_OTP (8 digits) unlocks
 * storing and reading the last code for an email so Playwright can finish
 * verification. Ignored when a Resend key is set.
 */
export function isE2eOtpStoreEnabled(): boolean {
  const apiKey = process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY;
  const e2e = process.env.AUTH_E2E_OTP?.trim();
  return !apiKey && !!e2e && /^\d{8}$/.test(e2e);
}

export function authEmailFrom(): string {
  return process.env.AUTH_EMAIL_FROM || DEFAULT_AUTH_EMAIL_FROM;
}

export async function sendAuthEmail(args: {
  email: string;
  token: string;
  purpose: "password-reset" | "email-verification";
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY;
  const from = authEmailFrom();

  if (!apiKey) {
    console.warn(
      `[convex-auth] AUTH_RESEND_KEY unset; ${args.purpose} code for ${args.email}: ${args.token}`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.email],
      subject: args.subject,
      text: args.text,
      html: args.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[convex-auth] Resend ${args.purpose} failed`, detail);
    throw new Error(
      args.purpose === "email-verification"
        ? "Failed to send verification email"
        : "Failed to send password reset email",
    );
  }
}
