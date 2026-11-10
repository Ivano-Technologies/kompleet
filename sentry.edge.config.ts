// sentry.edge.config.ts
import * as Sentry from "@sentry/nextjs";
import { resolveSentryDsn } from "./src/lib/sentry/dsn";

Sentry.init({
  dsn: resolveSentryDsn(),
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
});
