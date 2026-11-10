/**
 * The Convex Auth Next.js proxy forwards `error.message` to the browser.
 * In local/dev Convex that string includes the server stack. Strip frames
 * so they never leave `/api/auth`. Kept local so Edge `src/proxy.ts` does
 * not import `friendly-error` (Sentry).
 */
export function sanitizeAuthProxyErrorMessage(message: string): string {
  return message
    .split("\n")
    .filter((line) => !/^\s*at\s+\S/.test(line))
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
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
  const error = (body as { error: string }).error;
  const stripped = sanitizeAuthProxyErrorMessage(error);
  if (stripped === error) return response;
  return new Response(JSON.stringify({ ...(body as object), error: stripped }), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
