export const AUTH_OTP_LENGTH = 8;

/** Strip whitespace and non-digits, then cap at the 8-digit OTP length. */
export function sanitiseAuthOtp(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\D/g, "").slice(0, AUTH_OTP_LENGTH);
}

export function isCompleteAuthOtp(value: unknown): boolean {
  return sanitiseAuthOtp(value).length === AUTH_OTP_LENGTH;
}
