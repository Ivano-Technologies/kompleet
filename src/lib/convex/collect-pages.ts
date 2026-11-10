export const EXPORT_BATCH = 500;
export const EXPORT_MAX = 50_000;

export type CursorPage<T> = {
  items: T[];
  isDone: boolean;
  nextCursor: string | null;
};

/**
 * Walk Convex cursor pages from the Next.js process. Each Convex query may
 * call `.paginate()` only once, so full exports / compatibility "page N"
 * requests loop here instead of inside the query.
 */
export async function collectPagedItems<T>(
  readPage: (cursor: string | null) => Promise<CursorPage<T>>,
  maxItems: number = EXPORT_MAX,
): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page = await readPage(cursor);
    out.push(...page.items);
    if (out.length >= maxItems) {
      return out.slice(0, maxItems);
    }
    if (page.isDone || page.nextCursor === null) {
      return out;
    }
    cursor = page.nextCursor;
  }
}

/**
 * Resolve a 1-based page either from an explicit cursor or by walking from
 * the start. Used so existing `?page=` clients keep working.
 */
export async function readNumberedPage<T>(
  readPage: (cursor: string | null) => Promise<CursorPage<T>>,
  args: { page: number; cursor?: string | null },
): Promise<CursorPage<T>> {
  if (args.cursor) {
    return readPage(args.cursor);
  }
  const target = Math.max(args.page, 1);
  let cursor: string | null = null;
  let last: CursorPage<T> = { items: [], isDone: true, nextCursor: null };
  for (let i = 0; i < target; i++) {
    last = await readPage(cursor);
    if (last.isDone && i < target - 1) {
      return { items: [], isDone: true, nextCursor: null };
    }
    cursor = last.nextCursor;
  }
  return last;
}
