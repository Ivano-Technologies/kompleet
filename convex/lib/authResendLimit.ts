import { generateAuthOtp } from "./authEmail";

export const EMAIL_SEND_COOLDOWN_MS = 60_000;
export const EMAIL_SEND_MAX_PER_HOUR = 5;
export const EMAIL_SEND_HOUR_MS = 60 * 60 * 1000;
/** Floor so known (Resend) and unknown (no send) resend paths take the same time. */
export const RESEND_EQUAL_WORK_MS = 1_200;

export const EMAIL_SEND_RATE_LIMIT_MESSAGE = "Too many attempts";

export type AuthEmailSendPurpose = "email-verification" | "password-reset";

export type EmailSendLimitState = {
  lastSentAt: number;
  hourStartedAt: number;
  hourCount: number;
};

export function emailSendLimitIdentifier(
  purpose: AuthEmailSendPurpose,
  email: string,
): string {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

export function nextEmailSendState(
  state: EmailSendLimitState | null,
  now: number,
): { allowed: boolean; next: EmailSendLimitState } {
  if (state && now - state.lastSentAt < EMAIL_SEND_COOLDOWN_MS) {
    return { allowed: false, next: state };
  }
  const hourExpired =
    !state || now - state.hourStartedAt >= EMAIL_SEND_HOUR_MS;
  const hourCount = hourExpired ? 0 : state.hourCount;
  if (hourCount >= EMAIL_SEND_MAX_PER_HOUR) {
    return { allowed: false, next: state as EmailSendLimitState };
  }
  return {
    allowed: true,
    next: {
      lastSentAt: now,
      hourStartedAt: hourExpired ? now : state.hourStartedAt,
      hourCount: hourCount + 1,
    },
  };
}

export function isMissingAuthAccountError(error: unknown): boolean {
  const text =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "";
  return /InvalidAccountId/i.test(text);
}

export async function padElapsed(
  startedAt: number,
  minMs = RESEND_EQUAL_WORK_MS,
): Promise<void> {
  const wait = minMs - (Date.now() - startedAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

/** Same local work as a verification send, without delivering mail. */
export async function dummyVerificationSendWork(): Promise<void> {
  const token = generateAuthOtp();
  const payload = new TextEncoder().encode(
    JSON.stringify({
      purpose: "email-verification",
      token,
      subject: "Verify your Kompleet email",
    }),
  );
  await crypto.subtle.digest("SHA-256", payload);
}

export async function withEqualResendWork<T>(
  run: () => Promise<T>,
  onMissingAccount: () => Promise<T>,
  minMs = RESEND_EQUAL_WORK_MS,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await run();
    await padElapsed(started, minMs);
    return result;
  } catch (error) {
    if (isMissingAuthAccountError(error)) {
      try {
        return await onMissingAccount();
      } finally {
        await padElapsed(started, minMs);
      }
    }
    await padElapsed(started, minMs);
    throw error;
  }
}
