/** @vitest-environment node */

/**
 * Local Convex mutation-context tests for statement import writes.
 * Synthetic rows only — no customer or bank data.
 *
 * The in-memory ctx enforces Convex's 4,096-read cap so a regression that
 * brings back per-row gets fails this suite instead of production.
 */

import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  IMPORT_WRITE_BATCH_MAX,
  IMPORT_WRITE_BATCH_SIZE,
  STATEMENT_TOO_LONG_MESSAGE,
} from "./lib/importWrite";

const getCurrentUser = vi.fn();

vi.mock("./lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/auth")>();
  return {
    ...actual,
    getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
  };
});

import {
  createManyMineHandler,
  removeMineHandler,
  type CreateManyMineItem,
} from "./transactions";
import { addDuplicatesHandler } from "./imports";

const CONVEX_READ_LIMIT = 4096;
const SYNTHETIC_ROW_COUNT = 5_000;

const USER = {
  _id: "users:1",
  externalId: "u1",
  email: "ada@example.com",
};

function syntheticItems(count: number): CreateManyMineItem[] {
  const items: CreateManyMineItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      description: `SYNTHETIC merchant ${i}`,
      amount: 100 + (i % 50),
      transactionType: i % 2 === 0 ? "debit" : "credit",
      transactionDate: `2020-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      source: "synthetic_test",
      reference: `SYN-${i}`,
    });
  }
  return items;
}

function localConvex() {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    transactions: [],
    duplicateCandidates: [],
    importSessions: [
      {
        _id: "importSessions:1",
        externalId: "sess-1",
        userId: USER._id,
      },
    ],
  };
  const stats = { reads: 0, writes: 0, queries: 0 };
  const bumpRead = () => {
    stats.reads += 1;
    if (stats.reads > CONVEX_READ_LIMIT) {
      throw new Error(
        "Too many documents read in a single function execution (limit: 4096 documents).",
      );
    }
  };

  const ctx = {
    stats,
    tables,
    db: {
      insert: async (table: string, doc: Record<string, unknown>) => {
        stats.writes += 1;
        const id = `${table}:${tables[table]?.length ?? 0}`;
        (tables[table] ??= []).push({ _id: id, ...doc });
        return id;
      },
      get: async (id: string) => {
        bumpRead();
        for (const rows of Object.values(tables)) {
          const row = rows.find((r) => r._id === id);
          if (row) return row;
        }
        return null;
      },
      delete: async (id: string) => {
        stats.writes += 1;
        for (const rows of Object.values(tables)) {
          const idx = rows.findIndex((r) => r._id === id);
          if (idx >= 0) {
            rows.splice(idx, 1);
            return;
          }
        }
      },
      query: (table: string) => {
        stats.queries += 1;
        bumpRead();
        return {
          withIndex: (
            _name: string,
            build?: (q: {
              eq: (field: string, value: unknown) => unknown;
            }) => void,
          ) => {
            const eqs: Array<{ field: string; value: unknown }> = [];
            const q = {
              eq(field: string, value: unknown) {
                eqs.push({ field, value });
                return q;
              },
            };
            build?.(q);
            const rows = () =>
              (tables[table] ?? []).filter((row) =>
                eqs.every((clause) => row[clause.field] === clause.value),
              );
            return {
              unique: async () => {
                bumpRead();
                return rows()[0] ?? null;
              },
              first: async () => {
                bumpRead();
                return rows()[0] ?? null;
              },
              collect: async () => {
                const found = rows();
                for (let i = 0; i < found.length; i++) bumpRead();
                return found;
              },
            };
          },
        };
      },
    },
  };
  return ctx;
}

describe("createManyMine against local Convex", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    getCurrentUser.mockResolvedValue(USER);
  });

  it("inserts a batch without a per-row get and stays under the read cap", async () => {
    const ctx = localConvex();
    const items = syntheticItems(IMPORT_WRITE_BATCH_SIZE);
    const result = await createManyMineHandler(ctx as never, { items });
    expect(result.count).toBe(IMPORT_WRITE_BATCH_SIZE);
    expect(result.ids).toHaveLength(IMPORT_WRITE_BATCH_SIZE);
    expect(ctx.tables.transactions).toHaveLength(IMPORT_WRITE_BATCH_SIZE);
    expect(ctx.stats.queries).toBe(0);
    expect(ctx.stats.reads).toBe(0);
    expect(ctx.stats.writes).toBe(IMPORT_WRITE_BATCH_SIZE);
  });

  it("rejects a single call larger than IMPORT_WRITE_BATCH_MAX", async () => {
    const ctx = localConvex();
    await expect(
      createManyMineHandler(ctx as never, {
        items: syntheticItems(IMPORT_WRITE_BATCH_MAX + 1),
      }),
    ).rejects.toMatchObject({
      name: "ConvexError",
      data: STATEMENT_TOO_LONG_MESSAGE,
    });
    expect(ctx.tables.transactions).toHaveLength(0);
  });

  it("persists 5000+ synthetic rows in batches under Convex read/write limits", async () => {
    const ctx = localConvex();
    const items = syntheticItems(SYNTHETIC_ROW_COUNT);
    const ids: string[] = [];
    let maxReadsInBatch = 0;
    for (let i = 0; i < items.length; i += IMPORT_WRITE_BATCH_SIZE) {
      ctx.stats.reads = 0;
      ctx.stats.queries = 0;
      const chunk = items.slice(i, i + IMPORT_WRITE_BATCH_SIZE);
      const result = await createManyMineHandler(ctx as never, { items: chunk });
      ids.push(...result.ids);
      maxReadsInBatch = Math.max(maxReadsInBatch, ctx.stats.reads);
      expect(chunk.length).toBeLessThanOrEqual(IMPORT_WRITE_BATCH_MAX);
      expect(ctx.stats.queries).toBe(0);
    }
    expect(ids).toHaveLength(SYNTHETIC_ROW_COUNT);
    expect(ctx.tables.transactions).toHaveLength(SYNTHETIC_ROW_COUNT);
    expect(maxReadsInBatch).toBeLessThan(CONVEX_READ_LIMIT);
    expect(ids[0]).not.toBe(ids[1]);
  }, 15_000);

  it("rolls back a written batch via removeMineHandler", async () => {
    const ctx = localConvex();
    const created = await createManyMineHandler(ctx as never, {
      items: syntheticItems(3),
    });
    expect(ctx.tables.transactions).toHaveLength(3);
    const removed = await removeMineHandler(ctx as never, {
      externalIds: created.ids,
    });
    expect(removed).toBe(3);
    expect(ctx.tables.transactions).toHaveLength(0);
  });
});

describe("addDuplicates against local Convex", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    getCurrentUser.mockResolvedValue(USER);
  });

  it("inserts a duplicate batch and rejects oversized calls", async () => {
    const ctx = localConvex();
    const count = await addDuplicatesHandler(ctx as never, {
      sessionExternalId: "sess-1",
      candidates: [{ synthetic: true }],
    });
    expect(count).toBe(1);
    expect(ctx.tables.duplicateCandidates).toHaveLength(1);

    await expect(
      addDuplicatesHandler(ctx as never, {
        sessionExternalId: "sess-1",
        candidates: Array.from({ length: IMPORT_WRITE_BATCH_MAX + 1 }, (_, i) => ({
          i,
        })),
      }),
    ).rejects.toBeInstanceOf(ConvexError);
  });
});
