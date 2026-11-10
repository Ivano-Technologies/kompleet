// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";
import { resolveSentryDsn } from "./src/lib/sentry/public-dsn.mjs";

Sentry.init({
  dsn: resolveSentryDsn(),

  // Performance: capture 10% of server transactions in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Enable structured logs
  enableLogs: true,

  // Environment. Prefer Vercel env so preview events are distinct from prod.
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  // Give flush() a bounded wait when API routes await it before responding.
  shutdownTimeout: 8000,

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
