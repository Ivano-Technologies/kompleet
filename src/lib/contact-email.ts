/** C0 controls plus DEL — including CR/LF used in email header injection. */
const HEADER_CONTROLS = /[\u0000-\u001F\u007F]/g;

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip CR/LF and other control characters from a header value. */
export function stripHeaderControls(value: unknown): string {
  return String(value ?? "").replace(HEADER_CONTROLS, "").trim();
}

/** Name safe to interpolate into an email Subject header. */
export function contactSubjectName(name: unknown): string {
  return stripHeaderControls(name);
}

/**
 * Reply-To after stripping controls. Undefined when the result is not a
 * plausible address — omit the header rather than send a forged one.
 */
export function contactReplyTo(email: unknown): string | undefined {
  const cleaned = stripHeaderControls(email);
  if (!cleaned || !EMAIL_FORMAT.test(cleaned)) {
    return undefined;
  }
  return cleaned;
}
