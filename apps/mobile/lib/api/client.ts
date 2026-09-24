/**
 * Path B HTTP client: Next.js APIs backed by Convex.
 * Bearer token from Convex Auth (SecureStore).
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export function getApiBase(): string {
  return API_BASE.replace(/\/$/, "");
}

export async function apiFetch(
  path: string,
  token: string | null,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  });
}
