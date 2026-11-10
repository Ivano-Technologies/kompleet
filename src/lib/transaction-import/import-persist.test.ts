import { describe, expect, it, vi } from "vitest";
import {
  IMPORT_DUPLICATE_BATCH_SIZE,
  IMPORT_WRITE_BATCH_SIZE,
  ImportPersistError,
  chunkRows,
  persistImportedTransactions,
  rollbackWrittenIds,
  type ImportPersistItem,
} from "./import-persist";

const SYNTHETIC_ROW_COUNT = 5_000;

function syntheticItems(count: number): ImportPersistItem[] {
  const items: ImportPersistItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      description: `SYNTHETIC merchant ${i}`,
      amount: 10 + (i % 7),
      transactionType: i % 2 === 0 ? "debit" : "credit",
      transactionDate: `2021-${String((i % 12) + 1).padStart(2, "0")}-01`,
      source: "synthetic_test",
      reference: `SYN-${i}`,
    });
  }
  return items;
}

describe("chunkRows", () => {
  it("splits 5000 rows into 250-500 sized batches", () => {
    const chunks = chunkRows(syntheticItems(SYNTHETIC_ROW_COUNT));
    expect(chunks.length).toBe(Math.ceil(SYNTHETIC_ROW_COUNT / IMPORT_WRITE_BATCH_SIZE));
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThanOrEqual(1);
      expect(chunk.length).toBeLessThanOrEqual(500);
      expect(chunk.length).toBeLessThanOrEqual(IMPORT_WRITE_BATCH_SIZE);
    }
    expect(chunks.reduce((n, c) => n + c.length, 0)).toBe(SYNTHETIC_ROW_COUNT);
  });
});

describe("persistImportedTransactions", () => {
  it("writes 5000+ synthetic rows in batches against a local Convex client", async () => {
    const createCalls: number[] = [];
    const stored: string[] = [];
    const result = await persistImportedTransactions({
      items: syntheticItems(SYNTHETIC_ROW_COUNT),
      createMany: async (items) => {
        createCalls.push(items.length);
        const ids = items.map((_, i) => `tx-${stored.length + i}`);
        stored.push(...ids);
        return { ids, count: ids.length };
      },
      removeMany: async () => 0,
    });
    expect(result.imported).toBe(SYNTHETIC_ROW_COUNT);
    expect(result.ids).toHaveLength(SYNTHETIC_ROW_COUNT);
    expect(createCalls.every((n) => n <= IMPORT_WRITE_BATCH_SIZE)).toBe(true);
    expect(createCalls).toHaveLength(
      Math.ceil(SYNTHETIC_ROW_COUNT / IMPORT_WRITE_BATCH_SIZE),
    );
  }, 15_000);

  it("chunks addDuplicates and rolls back already-written createMany batches", async () => {
    const duplicateCalls: number[] = [];
    const removed: string[][] = [];
    let createCalls = 0;
    await expect(
      persistImportedTransactions({
        items: syntheticItems(1_000),
        duplicates: Array.from({ length: 600 }, (_, i) => ({ i })),
        addDuplicates: async (candidates) => {
          duplicateCalls.push(candidates.length);
          return candidates.length;
        },
        createMany: async (items) => {
          createCalls += 1;
          if (createCalls === 2) {
            throw new Error(
              "Too many documents read in a single function execution (limit: 4096 documents).",
            );
          }
          return {
            ids: items.map((_, i) => `kept-${createCalls}-${i}`),
            count: items.length,
          };
        },
        removeMany: async (ids) => {
          removed.push(ids);
          return ids.length;
        },
      }),
    ).rejects.toBeInstanceOf(ImportPersistError);

    expect(duplicateCalls.every((n) => n <= IMPORT_DUPLICATE_BATCH_SIZE)).toBe(
      true,
    );
    expect(duplicateCalls.reduce((n, c) => n + c, 0)).toBe(600);
    expect(createCalls).toBe(2);
    expect(removed).toHaveLength(1);
    expect(removed[0]?.[0]).toMatch(/^kept-1-/);
  });

  it("records leftover ids when rollback of a written batch fails", async () => {
    const error = await persistImportedTransactions({
      items: syntheticItems(IMPORT_WRITE_BATCH_SIZE + 10),
      createMany: async (items) => {
        if (items.length < IMPORT_WRITE_BATCH_SIZE) {
          throw new Error("[Request ID: abc] Server Error");
        }
        return {
          ids: items.map((_, i) => `id-${i}`),
          count: items.length,
        };
      },
      removeMany: async () => {
        throw new Error("rollback unavailable");
      },
    }).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ImportPersistError);
    const persist = error as ImportPersistError;
    expect(persist.rolledBack).toBe(false);
    expect(persist.leftoverIds).toHaveLength(IMPORT_WRITE_BATCH_SIZE);
  });
});

describe("rollbackWrittenIds", () => {
  it("continues remaining chunks after a failed chunk", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    const leftover = await rollbackWrittenIds(
      ["a", "b", "c"],
      async (ids) => {
        if (ids.includes("a")) throw new Error("nope");
        return ids.length;
      },
      1,
    );
    expect(leftover).toEqual(["a"]);
    warn.mockRestore();
  });
});
