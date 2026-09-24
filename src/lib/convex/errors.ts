/**
 * Convex HTTP client error matchers. Staging shiny-cricket-316 can lag
 * git: Phase 4 added getMineByIdempotencyKey + extra createMine fields
 * that the live deployment still rejects.
 */

export function isConvexFunctionMissing(error: unknown): boolean {
  return (
    error instanceof Error &&
    /could not find public function/i.test(error.message)
  );
}

export function isConvexArgumentExtraField(error: unknown): boolean {
  return (
    error instanceof Error &&
    /ArgumentValidationError/i.test(error.message) &&
    /extra field/i.test(error.message)
  );
}

export function isConvexAuthError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /not authenticated|unauthorized|authentication required/i.test(
      error.message,
    )
  );
}
