import { unstable_rethrow } from "next/navigation";

const NEXT_CONTROL_FLOW =
  /DYNAMIC_SERVER_USAGE|NEXT_(REDIRECT|NOT_FOUND|DYNAMIC|HTTP_ERROR|PRERENDER)|PRERENDER_INTERRUPTED|POSTPONE/i;

/**
 * Next.js 16 uses thrown errors to opt a Route Handler into dynamic rendering
 * (`cookies()`, `headers()`, postpone). Catch-all `try/catch` that swallows
 * those turns a cold first request into an opaque HTTP 500.
 */
export function rethrowIfNextControlFlow(error: unknown): void {
  unstable_rethrow(error);
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    NEXT_CONTROL_FLOW.test((error as { digest: string }).digest)
  ) {
    throw error;
  }
}
