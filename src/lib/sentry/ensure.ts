import * as Sentry from "@sentry/nextjs";
import { resolveSentryDsn } from "./dsn";

function clientHasDsn(client: unknown): boolean {
  if (!client || typeof client !== "object") return false;
  const withDsn = client as {
    getDsn?: () => unknown;
    getOptions?: () => { dsn?: string };
  };
  if (typeof withDsn.getDsn === "function" && Boolean(withDsn.getDsn())) {
    return true;
  }
  const dsn = withDsn.getOptions?.()?.dsn;
  return typeof dsn === "string" && dsn.startsWith("https://");
}

/**
 * Make sure this isolate has a Sentry client with a DSN.
 * Preview builds previously called Sentry.init with an empty inlined
 * NEXT_PUBLIC_SENTRY_DSN, which creates a disabled client that ignores
 * later init() calls. Close that client and re-init with the public DSN.
 */
export async function ensureServerSentry(): Promise<boolean> {
  try {
    const dsn = resolveSentryDsn();
    if (!dsn) return false;
    const existing =
      typeof Sentry.getClient === "function" ? Sentry.getClient() : undefined;
    if (clientHasDsn(existing)) return true;
    if (
      existing &&
      typeof (existing as { close?: (timeout?: number) => Promise<boolean> })
        .close === "function"
    ) {
      await (
        existing as { close: (timeout?: number) => Promise<boolean> }
      ).close(0);
    }
    if (typeof Sentry.init === "function") {
      Sentry.init({
        dsn,
        tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
        shutdownTimeout: 8000,
      });
    }
    const next =
      typeof Sentry.getClient === "function" ? Sentry.getClient() : undefined;
    return clientHasDsn(next);
  } catch {
    return false;
  }
}
