/**
 * Public Sentry client DSN for project kompleet-platform (write-only ingest).
 * Vercel currently injects NEXT_PUBLIC_SENTRY_DSN only on production.
 * Env still wins when present.
 */
export const KOMPLEET_PUBLIC_SENTRY_DSN = [
  "https://",
  "2c7f7c0e30121b2a971bdff94a3c0452",
  "@o4510868646920192.ingest.de.sentry.io/",
  "4510871367516240",
].join("");

export function resolveSentryDsn() {
  const fromEnv = (
    process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    ""
  ).trim();
  if (fromEnv.startsWith("https://")) return fromEnv;
  return KOMPLEET_PUBLIC_SENTRY_DSN;
}
