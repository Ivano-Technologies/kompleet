/**
 * NextResponse.json() throws on BigInt / circular values. Tax-report rows can
 * carry computation extras from Convex; never let serialization 500 the list.
 */
export function toJsonSafe<T>(value: T, fallback: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return fallback;
  }
}
