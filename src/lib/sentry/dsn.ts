/**
 * Public Sentry client DSN for project kompleet-platform.
 * This is a write-only ingest key (same class as NEXT_PUBLIC_SENTRY_DSN).
 *
 * Vercel currently injects NEXT_PUBLIC_SENTRY_DSN only on production, so
 * preview (and any server isolate that did not inline the env) generated a
 * support ref but never sent an event. Env still wins when present.
 */
const PUBLIC_KEY = "2c7f7c0e30121b2a971bdff94a3c0452";
const INGEST_HOST = "o4510868646920192.ingest.de.sentry.io";
const PROJECT_ID = "4510871367516240";

export function resolveSentryDsn(): string | undefined {
  const fromEnv =
    process.env.SENTRY_DSN?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (fromEnv && fromEnv.startsWith("https://")) return fromEnv;
  return `https://${PUBLIC_KEY}@${INGEST_HOST}/${PROJECT_ID}`;
}
