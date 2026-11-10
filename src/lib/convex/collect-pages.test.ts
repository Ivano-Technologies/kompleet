import { describe, expect, it, vi } from "vitest";
import {
  collectPagedItems,
  readNumberedPage,
} from "./collect-pages";

function pagesOf<T>(pages: T[][]) {
  return async (cursor: string | null) => {
    const index = cursor ? Number(cursor) : 0;
    const items = pages[index] ?? [];
    const isDone = index >= pages.length - 1;
    return {
      items,
      isDone,
      nextCursor: isDone ? null : String(index + 1),
    };
  };
}

describe("collectPagedItems", () => {
  it("concatenates every page until isDone", async () => {
    const items = await collectPagedItems(
      pagesOf([
        [1, 2],
        [3, 4],
        [5],
      ]),
    );
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it("stops at maxItems so exports stay capped", async () => {
    const items = await collectPagedItems(
      pagesOf([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]),
      5,
    );
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it("uses the continue cursor, not a restart from the first page", async () => {
    const seen: Array<string | null> = [];
    await collectPagedItems(async (cursor) => {
      seen.push(cursor);
      if (cursor === null) {
        return { items: ["a"], isDone: false, nextCursor: "next-1" };
      }
      if (cursor === "next-1") {
        return { items: ["b"], isDone: true, nextCursor: null };
      }
      throw new Error(`unexpected cursor ${cursor}`);
    });
    expect(seen).toEqual([null, "next-1"]);
  });
});

describe("readNumberedPage", () => {
  it("walks from the start for ?page= without a cursor", async () => {
    const page = await readNumberedPage(pagesOf([["p1"], ["p2"], ["p3"]]), {
      page: 2,
    });
    expect(page.items).toEqual(["p2"]);
    expect(page.isDone).toBe(false);
    expect(page.nextCursor).toBe("2");
  });

  it("uses an explicit cursor without replaying earlier pages", async () => {
    const readPage = vi.fn(pagesOf([["p1"], ["p2"]]));
    const page = await readNumberedPage(readPage, {
      page: 9,
      cursor: "1",
    });
    expect(page.items).toEqual(["p2"]);
    expect(readPage).toHaveBeenCalledTimes(1);
    expect(readPage).toHaveBeenCalledWith("1");
  });
});

describe("export completeness", () => {
  it("replays listMine-style pages into the same full list the old collect returned", async () => {
    const all = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}` }));
    const batch = 5;
    const convexQuery = vi.fn(async (_ref: unknown, args: { cursor?: string | null; limit: number }) => {
      const start = args.cursor ? Number(args.cursor) : 0;
      const slice = all.slice(start, start + args.limit);
      const next = start + slice.length;
      return {
        transactions: slice,
        isDone: next >= all.length,
        nextCursor: next >= all.length ? null : String(next),
      };
    });

    const collected = await collectPagedItems(
      async (cursor) => {
        const page = await convexQuery("transactions.listMine", {
          cursor,
          limit: batch,
        });
        return {
          items: page.transactions,
          isDone: page.isDone,
          nextCursor: page.nextCursor,
        };
      },
      50_000,
    );

    expect(collected).toEqual(all);
    expect(convexQuery).toHaveBeenCalledTimes(3);
    expect(convexQuery.mock.calls.map((call) => call[1]?.cursor)).toEqual([
      null,
      "5",
      "10",
    ]);
  });
});
