/**
 * Last-line sanitiser for `/api/auth` error JSON. The proxy already maps
 * `ConvexError.data` to a safe `{code}` string; this still strips stacks from
 * any leftover message and never forwards a redacted Request ID.
 * Kept local so Edge `src/proxy.ts` does not import `friendly-error` (Sentry).
 */
import { authProxyErrorBody } from "@/lib/auth/proxy-auth-error";

export function sanitizeAuthProxyErrorMessage(message: string): string {
  return authProxyErrorBody(new Error(message)).error;
}

export async function sanitizeAuthProxyResponse(
  response: Response,
): Promise<Response> {
  if (response.status < 400) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    return response;
  }
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { error?: unknown }).error !== "string"
  ) {
    return response;
  }
  const current = body as { error: string; code?: unknown };
  const rewritten = authProxyErrorBody(new Error(current.error));
  const sameError = rewritten.error === current.error;
  const sameCode =
    rewritten.code === undefined
      ? current.code === undefined
      : current.code === rewritten.code;
  if (sameError && sameCode) return response;
  return new Response(JSON.stringify({ ...current, ...rewritten }), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
