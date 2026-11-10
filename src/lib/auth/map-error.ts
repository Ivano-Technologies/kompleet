import {
  FRIENDLY_FALLBACK,
  FRIENDLY_MESSAGES,
  toFriendlyError,
  withRef,
  type FriendlyError,
} from "@/lib/friendly-error";

export type AuthErrorSurface =
  | "login"
  | "signup"
  | "verify"
  | "verify-resend"
  | "reset"
  | "forgot";

const REDACTED_FALLBACK: Record<AuthErrorSurface, string | undefined> = {
  login: FRIENDLY_MESSAGES.invalidCredentials,
  signup: FRIENDLY_MESSAGES.accountExists,
  verify: FRIENDLY_MESSAGES.invalidCode,
  "verify-resend": undefined,
  reset: FRIENDLY_MESSAGES.invalidCode,
  forgot: undefined,
};

/** Map an auth:signIn throw to copy. Known user errors omit the support Ref. */
export function mapAuthError(
  err: unknown,
  surface: AuthErrorSurface,
): FriendlyError {
  return toFriendlyError(err, FRIENDLY_FALLBACK, {
    context: `auth:${surface}`,
    redactedFallback: REDACTED_FALLBACK[surface],
  });
}

/** Banner text: Ref only for unexpected failures. */
export function authErrorText(result: FriendlyError): string {
  return result.known ? result.message : withRef(result.message, result.ref);
}
