/**
 * Accounts created before this instant already signed in without email OTP.
 * Treat them as verified so we do not lock out existing web or mobile users.
 * New signups after this instant must complete the 8 digit email code.
 *
 * Keep in sync with src/lib/auth/email-verified.ts.
 */
export const EMAIL_VERIFICATION_REQUIRED_AFTER_MS = Date.UTC(
  2026,
  10,
  9,
  17,
  50,
  0,
);

export function isEmailVerified(user: {
  emailVerificationTime?: number | null;
  createdAt: number;
  deletedAt?: number | null;
}): boolean {
  if (user.deletedAt) return false;
  if (user.emailVerificationTime) return true;
  return user.createdAt < EMAIL_VERIFICATION_REQUIRED_AFTER_MS;
}
