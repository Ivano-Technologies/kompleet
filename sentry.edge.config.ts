// sentry.edge.config.ts
import * as Sentry from "@sentry/nextjs";

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
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
});
