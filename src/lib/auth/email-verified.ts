/**
 * Accounts created before this instant already signed in without email OTP.
 * Treat them as verified so we do not lock out existing web or mobile users.
 * New signups after this instant must complete the 8 digit email code.
 *
 * Keep in sync with convex/lib/emailVerified.ts.
 */
export const EMAIL_VERIFICATION_REQUIRED_AFTER_MS = Date.UTC(
  2026,
  10,
  9,
  17,
  50,
  0,
);

export function isCreatedBeforeEmailVerificationRequired(
  createdAtMs: number,
): boolean {
  return createdAtMs < EMAIL_VERIFICATION_REQUIRED_AFTER_MS;
}

export function isCompatEmailVerified(user: {
  email_confirmed_at?: string | null;
  created_at?: string | null;
}): boolean {
  const confirmed = Date.parse(user.email_confirmed_at ?? "");
  if (Number.isFinite(confirmed) && confirmed > 0) {
    return true;
  }
  const created = Date.parse(user.created_at ?? "");
  if (!Number.isFinite(created)) {
    return false;
  }
  return isCreatedBeforeEmailVerificationRequired(created);
}
