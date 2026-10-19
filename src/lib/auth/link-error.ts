/**
 * Email link errors
 * =================
 * Old Supabase emails (magic link, password reset, sign up confirmation) still
 * point at `/auth/callback`. Convex Auth now owns sessions, so any of those
 * links is no longer usable. When a provider reports a failure it adds
 * `error`, `error_code` and `error_description` to the query string or to the
 * URL hash (`#error=access_denied&error_code=otp_expired`).
 *
 * We never show those raw values. They map to a fixed login error code:
 * - `expired_link`: the link expired, was already used or is invalid
 * - `auth_failed`: any other auth failure
 */

export type LoginLinkError = "expired_link" | "auth_failed";

/** Provider error codes that mean the link is expired, used or invalid. */
const EXPIRED_LINK_CODES = new Set([
  "otp_expired",
  "flow_state_expired",
  "flow_state_not_found",
  "bad_code_verifier",
  "bad_oauth_state",
  "invalid_token",
  "token_expired",
]);

/** Params an email link carries when it is a one time token or code. */
const LINK_TOKEN_PARAMS = ["code", "token", "token_hash"];

type ParamSource = { get(name: string): string | null };

function read(params: ParamSource, name: string): string {
  return (params.get(name) ?? "").trim().toLowerCase();
}

/**
 * Classify provider error params. Returns null when no error is present.
 */
export function classifyAuthLinkError(params: ParamSource): LoginLinkError | null {
  const error = read(params, "error");
  const code = read(params, "error_code");
  const description = read(params, "error_description");
  if (!error && !code && !description) return null;

  if (EXPIRED_LINK_CODES.has(code)) return "expired_link";
  if (!code && error === "access_denied") return "expired_link";
  if (/expired|invalid|already been used/.test(description)) return "expired_link";
  return "auth_failed";
}

/** Parse a location hash such as `#error=access_denied&error_code=otp_expired`. */
export function paramsFromHash(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

/**
 * Where `/auth/callback` sends the user. Provider errors are classified. A
 * leftover one time code or token can no longer be redeemed, so it counts as
 * an expired link. A bare visit goes to plain `/login`.
 */
export function callbackLoginError(params: URLSearchParams): LoginLinkError | null {
  const fromError = classifyAuthLinkError(params);
  if (fromError) return fromError;
  if (LINK_TOKEN_PARAMS.some((name) => params.get(name))) return "expired_link";
  return null;
}

/** Login URL path for a link error. */
export function loginPathForLinkError(kind: LoginLinkError): string {
  return `/login?error=${kind}`;
}
