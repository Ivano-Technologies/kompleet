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
 * becomes the fallback. The raw error is always logged (console.warn, plus
 * Sentry for unexpected errors). console.error would open the Next.js overlay
 * and flake e2e on expected user errors.
 */
import * as Sentry from "@sentry/nextjs";
import {
  AUTH_ERROR_CODES,
  isAuthErrorData,
  retryAfterSecondsFromData,
  type AuthErrorCode,
  type AuthErrorData,
} from "../../convex/lib/authErrors";
import { STATEMENT_TOO_LONG_MESSAGE } from "../../convex/lib/importWrite";

export const FRIENDLY_FALLBACK = "Something went wrong. Please try again.";

export const FRIENDLY_MESSAGES = {
  fallback: FRIENDLY_FALLBACK,
  invalidCredentials: "That email or password doesn't match. Check and try again.",
  accountExists:
    "An account with this email already exists. Try signing in or reset your password.",
  invalidCode: "That code is invalid or expired. Check it or request a new one.",
  network: "We couldn't reach Kompleet. Check your connection and try again.",
  rateLimited: "Too many attempts. Please wait a moment and try again.",
  unverified:
    "Confirm your email before signing in. Check your inbox for the code.",
  unauthorized: "Your session has expired. Please sign in again.",
  missingTaxRule:
    "This tax figure hasn't been verified yet, so we can't calculate it right now. Please try again later.",
  statementTooLong: STATEMENT_TOO_LONG_MESSAGE,
} as const;

const CONVEX_LIMIT_PATTERN =
  /too many (bytes|documents|reads|writes)|array.{0,40}(too (long|large)|length)|value is too large|data is too large|exceeded.{0,80}(read|write|byte|array|size) limit|write size|read size|4096 documents|8192 array/i;

/** True for Convex platform read/write/array/size limit errors. */
export function isConvexResourceLimitError(err: unknown): boolean {
  const text = `${rawText(err)} ${err instanceof Error ? err.message : ""} ${stripErrorWrappers(err instanceof Error ? err.message : rawText(err))}`;
  return CONVEX_LIMIT_PATTERN.test(text);
}

/**
 * Await pending Sentry envelopes before a serverless response ends.
 * Empty queue resolves immediately; failures are swallowed so flush never
 * masks the original error.
 */
export async function flushSentry(timeoutMs = 5000): Promise<boolean> {
  try {
    const client = Sentry.getClient?.();
    if (client && typeof client.flush === "function") {
      const flushed = await client.flush(timeoutMs);
      if (flushed !== false) return true;
    }
    if (typeof Sentry.flush === "function") {
      const flushed = await Sentry.flush(timeoutMs);
      return flushed !== false;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Friendly copy plus a support ref, then wait for Sentry to send the event.
 * Use on server error paths instead of `toFriendlyError` alone.
 */
export async function toFriendlyErrorAndFlush(
  err: unknown,
  fallback: string = FRIENDLY_FALLBACK,
  options: FriendlyMessageOptions = {},
): Promise<FriendlyError> {
  const result = toFriendlyError(err, fallback, options);
  await flushSentry();
  return result;
}

/** An error whose message is written for end users and is safe to display. */
export class UserFacingError extends Error {
  readonly status?: number;
  /** Ref already issued (e.g. by an API route), reused instead of a new one. */
  readonly ref?: string;

  constructor(message: string, options?: { status?: number; ref?: string }) {
    super(message);
    this.name = "UserFacingError";
    this.status = options?.status;
    this.ref = options?.ref && isRef(options.ref) ? options.ref : undefined;
  }
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REF_PATTERN = /^[A-Z0-9]{8}$/;

/** True for an 8 character support reference code. */
export function isRef(value: unknown): value is string {
  return typeof value === "string" && REF_PATTERN.test(value);
}

/** Generate an 8 character support reference code. */
export function generateRef(): string {
  const bytes = new Uint8Array(8);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

/** Turn a Sentry event id (32 hex chars) into an 8 character ref. */
export function refFromEventId(eventId: unknown): string | null {
  if (typeof eventId !== "string") return null;
  const hex = eventId.replace(/-/g, "");
  return /^[0-9a-f]{8}/i.test(hex) ? hex.slice(0, 8).toUpperCase() : null;
}

/** Separator between a friendly message and its ref in plain strings. */
export const REF_SEPARATOR = "\nRef: ";

/** "message\nRef: XXXXXXXX". Plain-text form for alerts and string state. */
export function withRef(message: string, ref: string): string {
  return `${message}${REF_SEPARATOR}${ref}`;
}

/** Split a string produced by `withRef` back into message and ref. */
export function splitRef(text: string): { message: string; ref: string | null } {
  const m = /\s*Ref: ([A-Z0-9]{8})\s*$/.exec(text);
  if (!m) return { message: text, ref: null };
  return { message: text.slice(0, m.index), ref: m[1] };
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

/** Drop V8/lib stack frames so they never reach UI copy or client logs. */
export function stripStackFrames(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\s*at\s+\S/.test(line))
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Remove Convex and runtime wrappers from an error message:
 * "[Request ID: abc] Server Error", "Uncaught Error: ", "Called by client",
 * and any stack trace lines.
 */
export function stripErrorWrappers(message: string): string {
  return stripStackFrames(message)
    .replace(/\[CONVEX [^\]]*\]\s*/gi, "")
    .replace(/\[Request ID: [^\]]*\]\s*/gi, "")
    .replace(/^\s*Server Error\s*/i, "")
    .replace(/\s*Called by client\s*$/i, "")
    .split("\n")
    .join(" ")
    .replace(/Uncaught\s+\w*Error:\s*/gi, "")
    .replace(/^\s*\w*Error:\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** JSON object after `ConvexError:` in a proxied `/api/auth` error message. */
function extractConvexErrorJson(text: string): unknown | null {
  const label = text.search(/ConvexError:\s*/);
  if (label < 0) return null;
  const start = text.indexOf("{", label);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1)) as unknown;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * Typed auth payload from a real ConvexError `.data`, or from the
 * `Uncaught ConvexError: {...}` string the Next.js `/api/auth` proxy returns
 * (it only forwards `error.message`, so `.data` never reaches the browser).
 */
export function authErrorDataFromUnknown(err: unknown): AuthErrorData | null {
  if (isConvexError(err) && isAuthErrorData(err.data)) return err.data;
  const original = err instanceof Error ? err.message : rawText(err);
  const fromLabel = extractConvexErrorJson(original);
  if (isAuthErrorData(fromLabel)) return fromLabel;
  const stripped = stripErrorWrappers(original);
  if (stripped.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(stripped);
      if (isAuthErrorData(parsed)) return parsed;
    } catch {
      // Not a typed payload.
    }
  }
  return null;
}

/** Safe to pass to console.* (never includes a stack). */
export function clientLogDetail(err: unknown): unknown {
  if (err instanceof Error) {
    return { name: err.name, message: stripStackFrames(err.message) };
  }
  if (typeof err === "string") return stripStackFrames(err);
  return err;
}

function isConvexError(err: unknown): err is { data: unknown } {
  return (
    !!err &&
    typeof err === "object" &&
    (err as { name?: unknown }).name === "ConvexError" &&
    "data" in err
  );
}

/** True when Convex redacted a plain Error to "[Request ID] Server Error". */
export function isRedactedConvexServerError(err: unknown): boolean {
  const raw = rawText(err);
  const message = err instanceof Error ? err.message : raw;
  if (!/server error|request id/i.test(raw) && !/server error|request id/i.test(message)) {
    return false;
  }
  const stripped = stripErrorWrappers(message);
  return stripped.length === 0 || /^server error\.?$/i.test(stripped);
}

export function rateLimitedMessage(retryAfterSeconds?: number | null): string {
  if (retryAfterSeconds == null || retryAfterSeconds < 1) {
    return FRIENDLY_MESSAGES.rateLimited;
  }
  if (retryAfterSeconds >= 3600) {
    const hours = Math.max(1, Math.round(retryAfterSeconds / 3600));
    if (hours <= 1) {
      return "Too many attempts. Please wait an hour and try again.";
    }
    return `Too many attempts. Please wait ${hours} hours and try again.`;
  }
  if (retryAfterSeconds < 60) {
    const seconds = Math.ceil(retryAfterSeconds);
    return `Too many attempts. Please wait ${seconds} second${seconds === 1 ? "" : "s"} and try again.`;
  }
  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (minutes === 1) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return `Too many attempts. Please wait ${minutes} minutes and try again.`;
}

function messageForAuthCode(
  code: AuthErrorCode,
  retryAfterSeconds: number | null,
): string {
  switch (code) {
    case AUTH_ERROR_CODES.INVALID_CODE:
    case AUTH_ERROR_CODES.EXPIRED_CODE:
      return FRIENDLY_MESSAGES.invalidCode;
    case AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS:
    case AUTH_ERROR_CODES.RATE_LIMITED:
      return rateLimitedMessage(retryAfterSeconds);
    case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return FRIENDLY_MESSAGES.invalidCredentials;
    case AUTH_ERROR_CODES.ACCOUNT_EXISTS:
      return FRIENDLY_MESSAGES.accountExists;
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}

function deliberateMessage(err: unknown): string | null {
  if (err instanceof UserFacingError) return err.message.trim() || null;
  if (isConvexError(err)) {
    const { data } = err;
    // Typed auth codes are mapped in mapKnown (wait time lives on the code).
    if (isAuthErrorData(data)) return null;
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
  "You can't change this invoice.": "You can't change this invoice.",
  "This invoice number is already used.":
    "This invoice number is already used.",
  "This invoice can't be changed.": "This invoice can't be changed.",
  "Only issued invoices can be marked paid.":
    "Only issued invoices can be marked paid.",
  "Only issued invoices can be cancelled.":
    "Only issued invoices can be cancelled.",
  "This invoice is already marked paid.":
    "This invoice is already marked paid.",
  "This invoice is already cancelled.": "This invoice is already cancelled.",
  "Add a reason to cancel this invoice.":
    "Add a reason to cancel this invoice.",
  "Enter the paid date as YYYY-MM-DD.": "Enter the paid date as YYYY-MM-DD.",
  "Enter an invoice number.": "Enter an invoice number.",
  "Quantity can't be negative.": "Quantity can't be negative.",
  "Unit price can't be negative.": "Unit price can't be negative.",
  "Discount can't be more than the line total.":
    "Discount can't be more than the line total.",
  "VAT rate must be between 0% and 100%.":
    "VAT rate must be between 0% and 100%.",
  "Enter a number for quantity.": "Enter a number for quantity.",
  "Enter a number for unit price.": "Enter a number for unit price.",
  "This invoice has already been issued.":
    "This invoice has already been issued.",
  "Add at least one item before issuing this invoice.":
    "Add at least one item before issuing this invoice.",
  "This update can't change the invoice status.":
    "This update can't change the invoice status.",
  "Use PDF, image, or CSV.": "Use a PDF, image or CSV file.",
  "File size must be less than 10MB": "File size must be less than 10MB.",
  "Expense already exists": "This expense already exists.",
  "Category is required": "Category is required.",
  "Current password is incorrect": "Current password is incorrect.",
  "Passwords do not match": "Passwords do not match.",
  "Used on invoices":
    "This client is used on invoices, so it can't be removed.",
  "Type delete my account to confirm.":
    "Type delete my account to confirm.",
  "Your account has been deleted.": "Your account has been deleted.",
  "This statement is too long. Try a shorter date range.":
    "This statement is too long. Try a shorter date range.",
};

const NOT_FOUND_PATTERN =
  /^(Invoice|Client|Transaction|Expense|Calculation|File|Report|Tax report|Form|Document|Category|Financial statement|Import session|Duplicate) not found\.?$/i;

function allowlisted(text: string): string | null {
  const key = text.replace(/\s+$/, "");
  if (USER_MESSAGE_ALLOWLIST[key]) return USER_MESSAGE_ALLOWLIST[key];
  const noDot = key.replace(/\.$/, "");
  if (USER_MESSAGE_ALLOWLIST[noDot]) return USER_MESSAGE_ALLOWLIST[noDot];
  const withoutLine = key.replace(/^Line item \d+:\s*/, "");
  if (withoutLine !== key && USER_MESSAGE_ALLOWLIST[withoutLine]) {
    return USER_MESSAGE_ALLOWLIST[withoutLine];
  }
  const nf = NOT_FOUND_PATTERN.exec(key);
  if (nf) return `We couldn't find this ${nf[1].toLowerCase()}.`;
  return null;
}

/** Our own password rule validation text, kept as written. */
const PASSWORD_RULE_PATTERN = /^password (must|should)\b[^\n]{0,120}$/i;

function mapKnown(err: unknown, text: string): string | null {
  const typed = authErrorDataFromUnknown(err);
  if (typed) {
    return messageForAuthCode(typed.code, retryAfterSecondsFromData(typed));
  }
  if (isConvexResourceLimitError(err) || CONVEX_LIMIT_PATTERN.test(text)) {
    return FRIENDLY_MESSAGES.statementTooLong;
  }
  if (isNetworkError(err)) return FRIENDLY_MESSAGES.network;
  if (
    /unverified|email not verified|confirm your email|verification required/i.test(
      text,
    )
  ) {
    return FRIENDLY_MESSAGES.unverified;
  }
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
  /**
   * When Convex redacts a plain Error to "[Request ID] Server Error" with no
   * typed code, override the displayed copy. The error is still reported to
   * Sentry and the Ref is still hidden.
   */
  redactedFallback?: string;
}

export interface FriendlyError {
  /** Friendly copy, without the ref. */
  message: string;
  /** 8 character support reference, logged next to the raw error. */
  ref: string;
  /** True for expected user mistakes. Those must not create Sentry events. */
  known: boolean;
  /**
   * Hide the support Ref in the UI. Unexpected redacted Convex faults still
   * go to Sentry (`known` is false) but must not show a Ref.
   */
  hideRef: boolean;
}

/**
 * Turn any thrown value into friendly copy plus a support ref.
 * The ref is the Sentry event id when the error is reported to Sentry,
 * otherwise a generated code. The raw error is logged with the same ref.
 * @param err The caught value.
 * @param fallback Shown when the error is unexpected. Defaults to
 *   "Something went wrong. Please try again."
 */
export function toFriendlyError(
  err: unknown,
  fallback: string = FRIENDLY_FALLBACK,
  options: FriendlyMessageOptions = {},
): FriendlyError {
  const deliberate = deliberateMessage(err);
  const text = stripErrorWrappers(
    deliberate ?? (err instanceof Error ? err.message : rawText(err)),
  );
  const mapped = deliberate ? null : mapKnown(err, text);
  const redactedFault =
    !deliberate && !mapped && isRedactedConvexServerError(err);
  const knownCopy = deliberate ?? mapped;
  const message =
    knownCopy ??
    (redactedFault && options.redactedFallback
      ? options.redactedFallback
      : null) ??
    (fallback || FRIENDLY_FALLBACK);
  const known = knownCopy != null;
  const hideRef = known || redactedFault;

  let ref: string | null = err instanceof UserFacingError && err.ref ? err.ref : null;
  if (!ref && !known && !options.silent) {
    try {
      ref = refFromEventId(
        Sentry.captureException(err, {
          tags: options.context ? { context: options.context } : undefined,
        }),
      );
    } catch {
      // Sentry not configured; the console log below is enough.
    }
  }
  ref = ref ?? generateRef();

  if (!options.silent) {
    console.warn(
      `[friendly-error] ref=${ref}${options.context ? ` context=${options.context}` : ""}`,
      clientLogDetail(err),
    );
  }
  return { message, ref, known, hideRef };
}

/**
 * String form of `toFriendlyError`: "message\nRef: XXXXXXXX".
 * Render it with `<ErrorText>` so the ref shows as a muted line.
 */
export function toFriendlyMessage(
  err: unknown,
  fallback: string = FRIENDLY_FALLBACK,
  options: FriendlyMessageOptions = {},
): string {
  const { message, ref } = toFriendlyError(err, fallback, options);
  return withRef(message, ref);
}

const RAW_PATTERN =
  /server error|request id|\bat\s+\S+:\d+|\bundefined\b|\bnull\b|\w+Error:|stack|ECONN|ENOTFOUND|unexpected token|is not a function|cannot read propert/i;

/** True when a message looks like raw technical text, not user copy. */
export function looksLikeRawError(message: string): boolean {
  return RAW_PATTERN.test(message) || message.length > 300;
}

type ApiErrorBody = { error?: unknown; message?: unknown; ref?: unknown };

/**
 * Build a UserFacingError from a JSON error body returned by one of our own
 * API routes (`{ error, ref }`), or from a bare message. API routes only
 * return friendly text, but anything that still looks raw is replaced with
 * the fallback. The API's ref is kept so the UI shows the logged ref.
 */
export function userFacingError(
  body: unknown,
  fallback: string = FRIENDLY_FALLBACK,
  status?: number,
): UserFacingError {
  let message: unknown = body;
  let ref: unknown;
  if (body && typeof body === "object") {
    const b = body as ApiErrorBody;
    message = typeof b.error === "string" ? b.error : b.message;
    ref = b.ref;
  }
  const text = typeof message === "string" ? message.trim() : "";
  const safe = /^(unauthori[sz]ed|unauthenticated|not authenticated)\.?$/i.test(text)
    ? FRIENDLY_MESSAGES.unauthorized
    : text && !looksLikeRawError(text)
      ? text
      : fallback || FRIENDLY_FALLBACK;
  return new UserFacingError(safe, {
    status,
    ref: isRef(ref) ? ref : undefined,
  });
}

/** Read a friendly error out of a failed fetch response from our own API routes. */
export async function responseError(
  res: Response,
  fallback: string = FRIENDLY_FALLBACK,
): Promise<UserFacingError> {
  let body: unknown = null;
  try {
    body = await res.clone().json();
  } catch {
    // Non-JSON body.
  }
  if (res.status === 429) {
    const ref = body && typeof body === "object" ? (body as ApiErrorBody).ref : undefined;
    return new UserFacingError(FRIENDLY_MESSAGES.rateLimited, {
      status: 429,
      ref: isRef(ref) ? ref : undefined,
    });
  }
  return userFacingError(body, fallback, res.status);
}

/**
 * Friendly string (with ref) for a JSON error body from our own API routes,
 * for setting UI error state directly. Logs the ref with the body.
 */
export function apiErrorMessage(
  body: unknown,
  fallback: string = FRIENDLY_FALLBACK,
): string {
  return toFriendlyMessage(userFacingError(body, fallback), fallback, {
    context: "api",
  });
}

/**
 * API route JSON body for a caught exception: `{ error, ref }`.
 * Logs the raw error with the same ref on the server (and Sentry for
 * unexpected errors). Spread it into the response object.
 */
export function friendlyErrorBody(
  err: unknown,
  fallback: string = FRIENDLY_FALLBACK,
  options: FriendlyMessageOptions = {},
): { error: string; ref: string } {
  const { message, ref } = toFriendlyError(err, fallback, options);
  return { error: message, ref };
}

/**
 * Async API error body that flushes Sentry before the caller returns a response.
 */
export async function friendlyErrorBodyAndFlush(
  err: unknown,
  fallback: string = FRIENDLY_FALLBACK,
  options: FriendlyMessageOptions = {},
): Promise<{ error: string; ref: string }> {
  const { message, ref } = await toFriendlyErrorAndFlush(err, fallback, options);
  return { error: message, ref };
}

/**
 * API route JSON body for an error we return on purpose (validation, auth,
 * not found): `{ error, ref }`. Logs the ref and message on the server.
 */
export function apiErrorBody(message: string): { error: string; ref: string } {
  const ref = generateRef();
  console.warn(`[api-error] ref=${ref}`, message);
  return { error: message, ref };
}

/**
 * For friendly errors we raise ourselves (no thrown value): issue a ref,
 * log it with the context and detail, and return "message\nRef: XXXXXXXX".
 */
export function friendlyWithNewRef(
  message: string,
  context: string,
  detail?: unknown,
): string {
  const ref = generateRef();
  console.warn(`[friendly-error] ref=${ref} context=${context}`, detail ?? message);
  return withRef(message, ref);
}
