/**
 * Friendly error messages
 * =======================
 * Every error shown to a Kompleet user must go through `toFriendlyMessage`.
 * We never show raw server errors, Convex "[Request ID: ...] Server Error"
 * wrappers, stack traces or arbitrary `err.message` text.
 *
 * Only messages we deliberately throw as user-facing are passed through:
 * - `UserFacingError` (client or server)
 * - `ConvexError` whose data is a string (or `{ message: string }`)
 * - our own password rule validation text
 * Known auth, network and rate limit cases map to plain text. Everything else
 * becomes the fallback. The raw error is always logged (console.error, plus
 * Sentry for unexpected errors).
 */
import * as Sentry from "@sentry/nextjs";

export const FRIENDLY_FALLBACK = "Something went wrong. Please try again.";

export const FRIENDLY_MESSAGES = {
  fallback: FRIENDLY_FALLBACK,
  invalidCredentials: "Email or password is incorrect.",
  accountExists:
    "An account with this email already exists. Try signing in or reset your password.",
  invalidCode: "This code is invalid or has expired. Request a new one.",
  network: "We couldn't reach Kompleet. Check your connection and try again.",
  rateLimited: "Too many attempts. Please wait a moment and try again.",
  unauthorized: "Your session has expired. Please sign in again.",
  missingTaxRule:
    "This tax figure hasn't been verified yet, so we can't calculate it right now. Please try again later.",
} as const;

/** An error whose message is written for end users and is safe to display. */
export class UserFacingError extends Error {
  readonly status?: number;

  constructor(message: string, options?: { status?: number }) {
    super(message);
    this.name = "UserFacingError";
    this.status = options?.status;
  }
}

/** Normalise an email for auth calls: trim whitespace and lowercase. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const NETWORK_PATTERN =
  /failed to fetch|fetch failed|networkerror|network error|network request failed|load failed|connection lost|err_internet_disconnected|you are offline/i;

function rawText(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

/** True only for genuine network failures (TypeError or fetch failure). */
export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  return NETWORK_PATTERN.test(rawText(err));
}

/**
 * Remove Convex and runtime wrappers from an error message:
 * "[Request ID: abc] Server Error", "Uncaught Error: ", "Called by client",
 * and any stack trace lines.
 */
export function stripErrorWrappers(message: string): string {
  return message
    .replace(/\[CONVEX [^\]]*\]\s*/gi, "")
    .replace(/\[Request ID: [^\]]*\]\s*/gi, "")
    .replace(/^\s*Server Error\s*/i, "")
    .replace(/\s*Called by client\s*$/i, "")
    .split("\n")
    .filter((line) => !/^\s*at\s+\S/.test(line))
    .join(" ")
    .replace(/Uncaught\s+\w*Error:\s*/gi, "")
    .replace(/^\s*\w*Error:\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isConvexError(err: unknown): err is { data: unknown } {
  return (
    !!err &&
    typeof err === "object" &&
    (err as { name?: unknown }).name === "ConvexError" &&
    "data" in err
  );
}

function deliberateMessage(err: unknown): string | null {
  if (err instanceof UserFacingError) return err.message.trim() || null;
  if (isConvexError(err)) {
    const { data } = err;
    if (typeof data === "string") return stripErrorWrappers(data) || null;
    if (data && typeof data === "object") {
      const m = (data as { message?: unknown }).message;
      if (typeof m === "string") return stripErrorWrappers(m) || null;
    }
  }
  return null;
}

/**
 * Validation messages our own Convex functions and API routes throw on
 * purpose, mapped to the copy we show. Matched after wrappers are stripped.
 */
export const USER_MESSAGE_ALLOWLIST: Record<string, string> = {
  "Select a client before issuing": "Select a client before issuing.",
  "Add your business name in Settings before issuing":
    "Add your business name in Settings before issuing.",
  "Form is already marked as filed": "This form is already marked as filed.",
  "Cannot update finalized calculations":
    "Finalised calculations can't be changed.",
  "Cannot delete finalized calculations":
    "Finalised calculations can't be deleted.",
  "This calculation is already marked as final":
    "This calculation is already marked as final.",
  "Client name is required": "Client name is required.",
  "Client name must be less than 200 characters":
    "Client name must be less than 200 characters.",
  "Invalid email address": "Enter a valid email address.",
  "Email is required": "Email is required.",
  "Only draft invoices can be deleted": "Only draft invoices can be deleted.",
  "Invoice is immutable": "Issued invoices can't be changed.",
  "Use PDF, image, or CSV.": "Use a PDF, image or CSV file.",
  "File size must be less than 10MB": "File size must be less than 10MB.",
  "Expense already exists": "This expense already exists.",
  "Category is required": "Category is required.",
  "Current password is incorrect": "Current password is incorrect.",
  "Passwords do not match": "Passwords do not match.",
  "Used on invoices":
    "This client is used on invoices, so it can't be removed.",
};

const NOT_FOUND_PATTERN =
  /^(Invoice|Client|Transaction|Expense|Calculation|File|Report|Tax report|Form|Document|Category|Financial statement|Import session|Duplicate) not found\.?$/i;

function allowlisted(text: string): string | null {
  const key = text.replace(/\s+$/, "");
  if (USER_MESSAGE_ALLOWLIST[key]) return USER_MESSAGE_ALLOWLIST[key];
  const noDot = key.replace(/\.$/, "");
  if (USER_MESSAGE_ALLOWLIST[noDot]) return USER_MESSAGE_ALLOWLIST[noDot];
  const nf = NOT_FOUND_PATTERN.exec(key);
  if (nf) return `We couldn't find this ${nf[1].toLowerCase()}.`;
  return null;
}

/** Our own password rule validation text, kept as written. */
const PASSWORD_RULE_PATTERN = /^password (must|should)\b[^\n]{0,120}$/i;

function mapKnown(err: unknown, text: string): string | null {
  if (isNetworkError(err)) return FRIENDLY_MESSAGES.network;
  if (
    /rate.?limit|too many (requests|attempts)|\b429\b|TooManyFailedAttempts/i.test(
      text,
    )
  ) {
    return FRIENDLY_MESSAGES.rateLimited;
  }
  if (
    /account.*already exists|already.*(registered|an account)|email.*already (exists|in use|taken)|AccountAlreadyExists/i.test(
      text,
    )
  ) {
    return FRIENDLY_MESSAGES.accountExists;
  }
  if (
    /invalid.*code|code.*(invalid|expired)|could not verify code|InvalidVerificationCode|expired.*(code|token|link)/i.test(
      text,
    )
  ) {
    return FRIENDLY_MESSAGES.invalidCode;
  }
  if (
    /InvalidAccountId|InvalidSecret|invalid (credentials|password|email or password)|incorrect password|wrong password/i.test(
      text,
    )
  ) {
    return FRIENDLY_MESSAGES.invalidCredentials;
  }
  if ((err as { name?: unknown })?.name === "MissingTaxRuleError") {
    return FRIENDLY_MESSAGES.missingTaxRule;
  }
  if (
    (err as { name?: unknown })?.name === "ConvexUnauthorizedError" ||
    /^(unauthorized|unauthenticated|not authenticated|authentication required)\.?$/i.test(
      text,
    )
  ) {
    return FRIENDLY_MESSAGES.unauthorized;
  }
  const listed = allowlisted(text);
  if (listed) return listed;
  if (PASSWORD_RULE_PATTERN.test(text)) {
    const t = text.replace(/\.?$/, ".");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return null;
}

export interface FriendlyMessageOptions {
  /** Skip console/Sentry logging (e.g. in tight loops). Default false. */
  silent?: boolean;
  /** Short label for the log line, e.g. "invoices:issue". */
  context?: string;
}

/**
 * Turn any thrown value into text that is safe to show a user.
 * @param err The caught value.
 * @param fallback Shown when the error is unexpected. Defaults to
 *   "Something went wrong. Please try again."
 */
export function toFriendlyMessage(
  err: unknown,
  fallback: string = FRIENDLY_FALLBACK,
  options: FriendlyMessageOptions = {},
): string {
  const deliberate = deliberateMessage(err);
  const text = stripErrorWrappers(
    deliberate ?? (err instanceof Error ? err.message : rawText(err)),
  );
  const known = deliberate ? null : mapKnown(err, text);
  const result = deliberate ?? known ?? (fallback || FRIENDLY_FALLBACK);

  if (!options.silent && err !== undefined && err !== null) {
    console.error(
      `[friendly-error]${options.context ? ` ${options.context}` : ""}`,
      err,
    );
    if (!deliberate && !known) {
      try {
        Sentry.captureException(err, {
          tags: options.context ? { context: options.context } : undefined,
        });
      } catch {
        // Sentry not configured; console.error above is enough.
      }
    }
  }
  return result;
}

const RAW_PATTERN =
  /server error|request id|\bat\s+\S+:\d+|\bundefined\b|\bnull\b|\w+Error:|stack|ECONN|ENOTFOUND|unexpected token|is not a function|cannot read propert/i;

/** True when a message looks like raw technical text, not user copy. */
export function looksLikeRawError(message: string): boolean {
  return RAW_PATTERN.test(message) || message.length > 300;
}

/**
 * Build a UserFacingError from an `error` string returned by one of our own
 * API routes. API routes only return friendly text, but anything that still
 * looks raw is replaced with the fallback.
 */
export function userFacingError(
  message: unknown,
  fallback: string = FRIENDLY_FALLBACK,
  status?: number,
): UserFacingError {
  const text = typeof message === "string" ? message.trim() : "";
  const safe =
    text && !looksLikeRawError(text) ? text : fallback || FRIENDLY_FALLBACK;
  return new UserFacingError(safe, { status });
}

/** Read a friendly error out of a failed fetch response from our own API routes. */
export async function responseError(
  res: Response,
  fallback: string = FRIENDLY_FALLBACK,
): Promise<UserFacingError> {
  if (res.status === 429) {
    return new UserFacingError(FRIENDLY_MESSAGES.rateLimited, { status: 429 });
  }
  let message: unknown = null;
  try {
    const data: unknown = await res.clone().json();
    if (data && typeof data === "object") {
      const d = data as { error?: unknown; message?: unknown };
      message = typeof d.error === "string" ? d.error : d.message;
    }
  } catch {
    // Non-JSON body.
  }
  return userFacingError(message, fallback, res.status);
}

/** String form of `userFacingError` for setting UI error state directly. */
export function apiErrorMessage(
  message: unknown,
  fallback: string = FRIENDLY_FALLBACK,
): string {
  return userFacingError(message, fallback).message;
}
