/**
 * Convex values cannot be `undefined`. Optional query/mutation fields must be
 * omitted entirely rather than sent as `{ field: undefined }`.
 */
export function omitUndefined<T extends Record<string, unknown>>(
  value: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      out[key] = entry;
    }
  }
  return out;
}
