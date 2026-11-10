/** Shorter Convex Auth lifetimes than the library defaults (JWT 1h, session 30d). */

export const JWT_DURATION_MS = 30 * 60 * 1000;
export const SESSION_INACTIVE_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_TOTAL_MS = 14 * 24 * 60 * 60 * 1000;

export const CONVEX_AUTH_SESSION = {
  totalDurationMs: SESSION_TOTAL_MS,
  inactiveDurationMs: SESSION_INACTIVE_MS,
};

export const CONVEX_AUTH_JWT = {
  durationMs: JWT_DURATION_MS,
};

export const MAX_AUTH_DEVICES = 20;
