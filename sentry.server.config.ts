// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: capture 10% of server transactions in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Enable structured logs
  enableLogs: true,

  // Environment
  environment: process.env.NODE_ENV,

  // Pino integration: capture Pino logs as Sentry logs + errors
  // KOMPLEET already uses Pino — this bridges them
  integrations: [
    Sentry.pinoIntegration({
      // Forward Pino warn/error to Sentry as error events
      error: {
        levels: ["error", "fatal"],
      },
      // Forward all Pino levels to Sentry Logs
      log: {
        levels: ["info", "warn", "error", "fatal"],
      },
    }),
  ],

  // Filter out noisy server errors
  beforeSend(event) {
    // Ignore expected 401/403 responses (not real errors)
    if (event.exception?.values?.[0]?.value?.includes("401")) return null;
    if (event.exception?.values?.[0]?.value?.includes("403")) return null;
    return event;
  },
});