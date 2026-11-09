/**
 * Convex Auth `signIn` resolves with `{ signingIn: true }` when a session
 * was issued, or `{ signingIn: false }` when another step (email OTP) is
 * required.
 */
export function didSignInComplete(result: unknown): boolean {
  if (result === true) return true;
  if (result === false || result == null) return false;
  if (typeof result === "object" && "signingIn" in result) {
    return (result as { signingIn: unknown }).signingIn === true;
  }
  return false;
}

export function verifyEmailPath(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return "/verify-email";
  return `/verify-email?email=${encodeURIComponent(trimmed)}`;
}
