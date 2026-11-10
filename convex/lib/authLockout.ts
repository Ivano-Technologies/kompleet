/**
 * Convex Auth sign-in / OTP failure budget.
 *
 * The library option is misspelled `maxFailedAttempsPerHour` (one "t").
 * Default in @convex-dev/auth is 10/hour (then one extra every 6 minutes).
 * We cap at 5/hour so a guessed password or OTP is locked out faster
 * (one extra attempt every 12 minutes after the budget is spent).
 */
export const SIGN_IN_MAX_FAILED_ATTEMPTS_PER_HOUR = 5;
export const CONVEX_AUTH_DEFAULT_MAX_FAILED_ATTEMPTS_PER_HOUR = 10;
