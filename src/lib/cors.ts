import { NextResponse } from "next/server";

/** Explicit origins always eligible when matched exactly. */
export function getExplicitAllowedOrigins(): string[] {
  return [
    "http://localhost:8081",
    "exp://localhost:8081",
    process.env.NEXT_PUBLIC_MOBILE_APP_URL,
  ].filter((origin): origin is string => Boolean(origin));
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
