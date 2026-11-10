// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

// Keep this file self-contained. The Sentry instrumentation entry does not
// reliably follow imports from src/, and preview builds inline an empty
// NEXT_PUBLIC_SENTRY_DSN. Env still wins when present.
const PUBLIC_SENTRY_DSN = [
  "https://",
  "2c7f7c0e30121b2a971bdff94a3c0452",
  "@o4510868646920192.ingest.de.sentry.io/",
  "4510871367516240",
].join("");

function resolveSentryDsn(): string {
  const fromEnv = (
    process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    ""
  ).trim();
  if (fromEnv.startsWith("https://")) return fromEnv;
  return PUBLIC_SENTRY_DSN;
}

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
