import {
  FRIENDLY_FALLBACK,
  FRIENDLY_MESSAGES,
  authErrorDataFromUnknown,
  toFriendlyError,
  withRef,
  type FriendlyError,
} from "@/lib/friendly-error";
import { AUTH_ERROR_CODES } from "../../../convex/lib/authErrors";

export type AuthErrorSurface =
  | "login"
  | "signup"
  | "verify"
  | "verify-resend"
  | "reset"
  | "forgot";

/** Map an auth:signIn throw to copy. Known user errors omit the support Ref. */
export function mapAuthError(
  err: unknown,
  surface: AuthErrorSurface,
): FriendlyError {
  const result = toFriendlyError(err, FRIENDLY_FALLBACK, {
    context: `auth:${surface}`,
  });

  if (surface !== "login") return result;

  const data = authErrorDataFromUnknown(err);
  if (data?.code === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS) {
    return {
      ...result,
      message: FRIENDLY_MESSAGES.invalidCredentials,
    };
  }

  if (
    result.hideRef ||
    result.message === FRIENDLY_MESSAGES.network ||
    result.message === FRIENDLY_MESSAGES.unverified ||
    result.message.startsWith("Too many attempts")
  ) {
    return result;
  }

  return {
    ...result,
    message: FRIENDLY_MESSAGES.invalidCredentials,
    known: true,
    hideRef: true,
  };
}

/** Banner text: Ref only for unexpected failures that are not redacted faults. */
export function authErrorText(result: FriendlyError): string {
  return result.known || result.hideRef
    ? result.message
    : withRef(result.message, result.ref);
}
