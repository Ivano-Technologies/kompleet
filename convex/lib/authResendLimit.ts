export const EMAIL_SEND_COOLDOWN_MS = 60_000;
export const EMAIL_SEND_MAX_PER_HOUR = 5;
export const EMAIL_SEND_HOUR_MS = 60 * 60 * 1000;

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
