import { NextResponse } from "next/server";

/**
 * Origins allowed in every environment, production included.
 *
 * `kompleet.techivano.com` is the canonical production host. The legacy
 * `ivanotechnologies.com` hosts are intentionally absent — see
 * docs/DOMAIN_MIGRATION.md for the cutover and rollback procedure.
 */
const ALWAYS_ALLOWED_ORIGINS = ["https://kompleet.techivano.com"];

/**
 * Expo Metro dev-server origins.
 *
 * These were previously allowlisted unconditionally, which meant a production
 * deployment would hand credentialed CORS headers to anything served from the
 * developer's own machine (flagged in docs/AUDIT_STATUS_2026-07-15.md). They
 * are now only eligible outside production.
 */
const DEV_ONLY_ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "exp://localhost:8081",
];

/** Explicit origins eligible when matched exactly, for the current NODE_ENV. */
export function getExplicitAllowedOrigins(): string[] {
  const origins: (string | undefined)[] = [
    ...ALWAYS_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_MOBILE_APP_URL,
  ];

  if (process.env.NODE_ENV !== "production") {
    origins.push(...DEV_ONLY_ALLOWED_ORIGINS);
  }

  return origins.filter((origin): origin is string => Boolean(origin));
}

/** Whether an Origin header value may receive credentialed CORS headers. */
export function isAllowedCorsOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  if (getExplicitAllowedOrigins().includes(origin)) {
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return (
    origin.startsWith("exp://") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://192.168.") ||
    origin.startsWith("http://10.0.")
  );
}

export function addCorsHeaders(response: NextResponse, origin: string) {
  if (isAllowedCorsOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );

  return response;
}
