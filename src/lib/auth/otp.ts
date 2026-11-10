import {
  AUTH_OTP_LENGTH,
  isCompleteAuthOtp,
  sanitiseAuthOtp,
} from "../../../convex/lib/authOtp";

export { AUTH_OTP_LENGTH, isCompleteAuthOtp, sanitiseAuthOtp };

/** Must stay in lockstep with EMAIL_VERIFICATION_MAX_AGE_SECONDS in convex/lib/authEmail.ts. */
export const EMAIL_VERIFICATION_MAX_AGE_MINUTES = 15;
/** Must stay in lockstep with PASSWORD_RESET_MAX_AGE_SECONDS in convex/lib/authEmail.ts. */
export const PASSWORD_RESET_MAX_AGE_MINUTES = 60;
