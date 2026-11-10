import { v } from "convex/values";

/** Max rows a Convex list query will paginate in one call (exports use 500). */
export const LIST_LIMIT_MAX = 500;
export const LIST_LIMIT_DEFAULT = 50;
/**
 * Max underlying transaction rows listMine will scan while skipping hidden
 * in-flight import rows. Stays under Convex's 4,096-read cap after session
 * collection. If the cap hits before the page is full, isDone is false and
 * the client can continue from nextCursor.
 */
export const LIST_VISIBLE_SCAN_MAX = 2500;
export const API_LIMIT_MAX = 100;
export const EXPORT_BATCH = 500;
export const EXPORT_MAX = 50_000;

export const cursorValidator = v.optional(v.union(v.string(), v.null()));

export const listCursorArgs = {
  cursor: cursorValidator,
  limit: v.optional(v.number()),
};

export const listCursorReturns = {
  nextCursor: v.union(v.string(), v.null()),
  isDone: v.boolean(),
};

export function clampListLimit(
  limit: number | undefined,
  max: number = LIST_LIMIT_MAX,
): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return LIST_LIMIT_DEFAULT;
  }
  return Math.min(Math.max(Math.floor(limit), 1), max);
}

export function paginationOptsFromArgs(
  args: { cursor?: string | null; limit?: number },
  max: number = LIST_LIMIT_MAX,
): { numItems: number; cursor: string | null } {
  return {
    numItems: clampListLimit(args.limit, max),
    cursor: args.cursor ?? null,
  };
}

export function nextCursorOf(result: {
  isDone: boolean;
  continueCursor: string;
}): string | null {
  return result.isDone ? null : result.continueCursor;
}

export function matchesSearch(
  haystack: string | undefined | null,
  needle: string | undefined,
): boolean {
  if (!needle) return true;
  return (haystack ?? "").toLowerCase().includes(needle.trim().toLowerCase());
}
