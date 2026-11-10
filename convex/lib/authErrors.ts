import { ConvexError } from "convex/values";
import { sanitiseAuthOtp } from "./authOtp";

export const AUTH_ERROR_CODES = {
  INVALID_CODE: "INVALID_CODE",
  EXPIRED_CODE: "EXPIRED_CODE",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_EXISTS: "ACCOUNT_EXISTS",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export type AuthErrorData = {
  code: AuthErrorCode;
  retryAfterSeconds?: number;
};

const AUTH_ERROR_CODE_SET = new Set<string>(Object.values(AUTH_ERROR_CODES));

export function isAuthErrorData(data: unknown): data is AuthErrorData {
  if (!data || typeof data !== "object" || !("code" in data)) return false;
  const code = (data as { code?: unknown }).code;
  return typeof code === "string" && AUTH_ERROR_CODE_SET.has(code);
}

export function retryAfterSecondsFromData(data: unknown): number | null {
  if (!isAuthErrorData(data)) return null;
  const value = data.retryAfterSeconds;
  return typeof value === "number" && value > 0 ? value : null;
}

function isConvexError(error: unknown): error is { name: string; data: unknown } {
  return (
    !!error &&
    typeof error === "object" &&
    (error as { name?: unknown }).name === "ConvexError" &&
    "data" in error
  );
}

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

/** Classify a Convex Auth / provider throw into a typed code, or null if unknown. */
export function classifyAuthError(error: unknown): AuthErrorCode | null {
  const text = errorText(error);
  if (/expired.*(code|token|link)|ExpiredVerificationCode/i.test(text)) {
    return AUTH_ERROR_CODES.EXPIRED_CODE;
  }
  if (/TooManyFailedAttempts|too many failed attempts/i.test(text)) {
    return AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS;
  }
  if (/rate.?limit|too many (requests|attempts)|\b429\b/i.test(text)) {
    return AUTH_ERROR_CODES.RATE_LIMITED;
  }
  if (
    /account.*already exists|AccountAlreadyExists|already.*(registered|an account)|email.*already (exists|in use|taken)/i.test(
      text,
    )
  ) {
    return AUTH_ERROR_CODES.ACCOUNT_EXISTS;
  }
  if (
    /InvalidAccountId|InvalidSecret|invalid credentials|incorrect password|wrong password|invalid (password|email or password)/i.test(
      text,
    )
  ) {
    return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  }
  if (
    /invalid.*code|code.*(invalid|expired)|could not verify code|InvalidVerificationCode/i.test(
      text,
    )
  ) {
    return AUTH_ERROR_CODES.INVALID_CODE;
  }
  return null;
}

export function throwAuthError(
  code: AuthErrorCode,
  retryAfterSeconds?: number | null,
): never {
  const data: AuthErrorData =
    retryAfterSeconds != null && retryAfterSeconds > 0
      ? { code, retryAfterSeconds }
      : { code };
  throw new ConvexError(data);
}

const PASSWORD_RULE_PATTERN = /^password (must|should)\b/i;

/**
 * Re-throw known auth failures as ConvexError so Convex does not redact them
 * to "[Request ID] Server Error" in production.
 */
export function toTypedAuthError(error: unknown): never {
  if (isConvexError(error)) {
    throw error;
  }
  const text = error instanceof Error ? error.message : errorText(error);
  if (PASSWORD_RULE_PATTERN.test(text) || text === "Email is required") {
    throw new ConvexError(text);
  }
  const code = classifyAuthError(error);
  if (code) {
    throwAuthError(
      code,
      code === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS ? 60 * 60 : undefined,
    );
  }
  throw error;
}

export function withSanitisedAuthCode(
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (!("code" in params)) return params;
  if (params.code === undefined || params.code === null || params.code === "") {
    return params;
  }
  return { ...params, code: sanitiseAuthOtp(params.code) };
}

export function isBlankAuthCode(params: Record<string, unknown>): boolean {
  const code = params.code;
  return code === undefined || code === null || code === "";
}
