/**
 * Mobile logger: logs only in __DEV__ to satisfy no_console_logs_in_prod.
 * Use for init/sync/OCR errors so we don't leak logs in production.
 */
function log(
  level: "error" | "warn" | "info",
  message: string,
  context?: Record<string, unknown>,
): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const payload = context ? `${message} ${JSON.stringify(context)}` : message;
    if (level === "error") {
      // eslint-disable-next-line no-console
      console.error("[Kompleet]", payload);
    } else if (level === "warn") {
      // eslint-disable-next-line no-console
      console.warn("[Kompleet]", payload);
    } else {
      // eslint-disable-next-line no-console
      console.log("[Kompleet]", payload);
    }
  }
}

export const logger = {
  error: (message: string, context?: Record<string, unknown>) =>
    log("error", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log("warn", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),
};
