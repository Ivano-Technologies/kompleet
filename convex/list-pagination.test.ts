/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
const userCanAccessClient = vi.fn();
const loadBusinessProfile = vi.fn();

vi.mock("./lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/auth")>();
  return {
    ...actual,
    getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
    userCanAccessClient: (...args: unknown[]) => userCanAccessClient(...args),
  };
});

vi.mock("./lib/profiles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/profiles")>();
  return {
    ...actual,
    loadBusinessProfile: (...args: unknown[]) => loadBusinessProfile(...args),
  };
});

import { listMineHandler as listExpenses } from "./expenses";
import { listMineHandler as listInvoices } from "./invoices";
import {
  applyTriageMineHandler,
  collectTriage,
  listMineHandler as listTransactions,
  updateMineHandler,
} from "./transactions";

const USER = {
  _id: "users:1",
  externalId: "u1",
  email: "ada@example.com",
};

type Clause = { op: "eq" | "gte" | "lte"; field: string; value: unknown };

function applyClauses(
  rows: Array<Record<string, unknown>>,
  clauses: Clause[],
) {
  return rows.filter((row) =>
    clauses.every((clause) => {
      const value = row[clause.field];
      if (clause.op === "eq") return value === clause.value;
      if (clause.op === "gte") return (value as number | string) >= (clause.value as number | string);
      return (value as number | string) <= (clause.value as number | string);
    }),
  );
}

function chainRows(initial: Array<Record<string, unknown>>) {
  let rows = initial;
  const chain = {
    filter(
      fn: (q: {
        field: (name: string) => { field: string };
        eq: (left: { field: string }, value: unknown) => Clause;
        gte: (left: { field: string }, value: unknown) => Clause;
      }) => Clause,
    ) {
      const q = {
        field: (name: string) => ({ field: name }),
        eq: (left: { field: string }, value: unknown): Clause => ({
          op: "eq" as const,
          field: left.field,
          value,
        }),
        gte: (left: { field: string }, value: unknown): Clause => ({
          op: "gte" as const,
          field: left.field,
          value,
        }),
      };
      rows = applyClauses(rows, [fn(q)]);
      return chain;
    },
    order(direction: "asc" | "desc") {
      const field =
        rows[0] && "transactionDate" in rows[0]
          ? "transactionDate"
          : rows[0] && "date" in rows[0]
            ? "date"
            : "createdAt";
      rows = [...rows].sort((a, b) => {
        const av = a[field] as string | number;
        const bv = b[field] as string | number;
        if (av === bv) {
          return direction === "desc"
            ? Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)
            : Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0);
        }
        if (direction === "desc") return av < bv ? 1 : -1;
        return av < bv ? -1 : 1;
      });
      return chain;
    },
    paginate(opts: { numItems: number; cursor: string | null }) {
      const start = opts.cursor ? Number(opts.cursor) : 0;
      const page = rows.slice(start, start + opts.numItems);
      const next = start + page.length;
      return Promise.resolve({
        page,
        isDone: next >= rows.length,
        continueCursor: String(next),
      });
    },
    collect: async () => rows,
    take: async (n: number) => rows.slice(0, n),
    first: async () => rows[0] ?? null,
    unique: async () => rows[0] ?? null,
  };
  return chain;
}

function fakeCtx(tables: Record<string, Array<Record<string, unknown>>>) {
  return {
    db: {
      get: async (id: string) => {
        for (const rows of Object.values(tables)) {
          const found = rows.find((row) => row._id === id);
          if (found) return found;
        }
        return null;
      },
      patch: async (id: string, fields: Record<string, unknown>) => {
        for (const rows of Object.values(tables)) {
          const found = rows.find((row) => row._id === id);
          if (found) Object.assign(found, fields);
        }
      },
      insert: async (table: string, doc: Record<string, unknown>) => {
        const id = `${table}:${(tables[table] ?? []).length}`;
        (tables[table] ??= []).push({ _id: id, ...doc });
        return id;
      },
      query: (table: string) => ({
        withIndex: (
          _name: string,
          build?: (q: {
            eq: (field: string, value: unknown) => unknown;
            gte: (field: string, value: unknown) => unknown;
            lte: (field: string, value: unknown) => unknown;
          }) => void,
        ) => {
          const clauses: Clause[] = [];
          const q = {
            eq(field: string, value: unknown) {
              clauses.push({ op: "eq", field, value });
              return q;
            },
            gte(field: string, value: unknown) {
              clauses.push({ op: "gte", field, value });
              return q;
            },
            lte(field: string, value: unknown) {
              clauses.push({ op: "lte", field, value });
              return q;
            },
          };
          build?.(q);
          return chainRows(applyClauses(tables[table] ?? [], clauses));
        },
      }),
    },
  };
}

function txn(i: number, extras: Record<string, unknown> = {}) {
  const day = String(10 + (i % 20)).padStart(2, "0");
  return {
    _id: `tx:${i}`,
    externalId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    userId: USER._id,
    userExternalId: USER.externalId,
    transactionDate: `2026-01-${day}`,
    description: extras.description ?? `Row ${i}`,
    amount: 100 + i,
    transactionType: extras.transactionType ?? "debit",
    categoryExternalId: extras.categoryExternalId,
    isReconciled: false,
    createdAt: 1_000 + i,
    updatedAt: 1_000 + i,
    ...extras,
  };
}

function expense(i: number, extras: Record<string, unknown> = {}) {
  const day = String(10 + (i % 20)).padStart(2, "0");
  return {
    _id: `ex:${i}`,
    externalId: `exp-${i}`,
    userExternalId: USER.externalId,
    userId: USER._id,
    date: extras.date ?? `2026-02-${day}`,
    amount: 50 + i,
    currency: "NGN",
    categoryExternalId: extras.categoryExternalId,
    vendor: `Vendor ${i}`,
    createdAt: 2_000 + i,
    updatedAt: extras.updatedAt ?? 2_000 + i,
    ...extras,
  };
}

describe("Convex list pagination", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    getCurrentUser.mockResolvedValue(USER);
    userCanAccessClient.mockResolvedValue(true);
    loadBusinessProfile.mockResolvedValue(null);
  });

  it("transactions: walks multiple pages with a continuous cursor", async () => {
    const rows = Array.from({ length: 5 }, (_, i) => txn(i));
    const ctx = fakeCtx({ transactions: rows, categories: [] });
    const first = await listTransactions(ctx as never, { limit: 2 });
    expect(first.transactions).toHaveLength(2);
    expect(first.isDone).toBe(false);
    expect(first.nextCursor).toBe("2");

    const second = await listTransactions(ctx as never, {
      limit: 2,
      cursor: first.nextCursor,
    });
    expect(second.transactions.map((row) => row.id)).toEqual(
      first.transactions.map((row) => row.id).length
        ? rows
            .slice()
            .sort((a, b) =>
              a.transactionDate === b.transactionDate
                ? b.createdAt - a.createdAt
                : a.transactionDate < b.transactionDate
                  ? 1
                  : -1,
            )
            .slice(2, 4)
            .map((row) => row.externalId)
        : [],
    );
    expect(second.isDone).toBe(false);

    const third = await listTransactions(ctx as never, {
      limit: 2,
      cursor: second.nextCursor,
    });
    expect(third.transactions).toHaveLength(1);
    expect(third.isDone).toBe(true);
    expect(third.nextCursor).toBeNull();
  });

  it("transactions: date range and type filters apply before paging", async () => {
    const rows = [
      txn(1, { transactionDate: "2026-01-01", transactionType: "debit" }),
      txn(2, { transactionDate: "2026-01-15", transactionType: "credit" }),
      txn(3, { transactionDate: "2026-01-20", transactionType: "credit" }),
      txn(4, { transactionDate: "2026-02-01", transactionType: "credit" }),
    ];
    const ctx = fakeCtx({ transactions: rows, categories: [] });
    const page = await listTransactions(ctx as never, {
      startDate: "2026-01-10",
      endDate: "2026-01-31",
      type: "credit",
      limit: 10,
    });
    expect(page.transactions.map((row) => row.id)).toEqual([
      rows[2]!.externalId,
      rows[1]!.externalId,
    ]);
    expect(page.isDone).toBe(true);
  });

  it("transactions: search post-filters the current page", async () => {
    const rows = [
      txn(1, { description: "GTBank salary" }),
      txn(2, { description: "Uber ride" }),
      txn(3, { description: "GTBank transfer" }),
    ];
    const ctx = fakeCtx({ transactions: rows, categories: [] });
    const page = await listTransactions(ctx as never, {
      search: "gtbank",
      limit: 10,
    });
    expect(page.transactions.map((row) => row.description)).toEqual([
      "GTBank transfer",
      "GTBank salary",
    ]);
  });

  it("hides mid-import rows until the session is completed", async () => {
    const rows = [
      txn(1, { description: "legacy visible" }),
      txn(2, {
        description: "processing hidden",
        importSessionExternalId: "sess-mid",
      }),
      txn(3, {
        description: "completed visible",
        importSessionExternalId: "sess-done",
      }),
    ];
    const ctx = fakeCtx({
      transactions: rows,
      categories: [],
      importSessions: [
        {
          _id: "importSessions:mid",
          externalId: "sess-mid",
          userId: USER._id,
          status: "processing",
          createdAt: Date.now() - 2 * 60 * 60 * 1000,
        },
        {
          _id: "importSessions:done",
          externalId: "sess-done",
          userId: USER._id,
          status: "completed",
          createdAt: Date.now() - 86_400_000,
        },
      ],
    });
    const page = await listTransactions(ctx as never, { limit: 10 });
    expect(page.transactions.map((row) => row.description)).toEqual([
      "completed visible",
      "legacy visible",
    ]);

    const including = await listTransactions(ctx as never, {
      limit: 10,
      includePendingImports: true,
    });
    expect(including.transactions.map((row) => row.description)).toEqual([
      "completed visible",
      "processing hidden",
      "legacy visible",
    ]);
  });

  it("keeps an orphaned processing session hidden", async () => {
    const rows = [
      txn(1, {
        description: "killed import leftover",
        importSessionExternalId: "sess-orphan",
      }),
      txn(2, { description: "manual row" }),
    ];
    const ctx = fakeCtx({
      transactions: rows,
      categories: [],
      importSessions: [
        {
          _id: "importSessions:orphan",
          externalId: "sess-orphan",
          userId: USER._id,
          status: "processing",
          createdAt: 1,
        },
      ],
    });
    const page = await listTransactions(ctx as never, { limit: 10 });
    expect(page.transactions.map((row) => row.description)).toEqual([
      "manual row",
    ]);
  });

  it("keeps paging past hidden in-flight rows until the visible page is full", async () => {
    const rows = [
      txn(1, {
        transactionDate: "2026-01-01",
        description: "visible-a",
      }),
      txn(2, {
        transactionDate: "2026-01-02",
        description: "visible-b",
      }),
      txn(3, {
        transactionDate: "2026-01-03",
        description: "hidden-a",
        importSessionExternalId: "sess-mid",
      }),
      txn(4, {
        transactionDate: "2026-01-04",
        description: "hidden-b",
        importSessionExternalId: "sess-mid",
      }),
    ];
    const ctx = fakeCtx({
      transactions: rows,
      categories: [],
      importSessions: [
        {
          _id: "importSessions:mid",
          externalId: "sess-mid",
          userId: USER._id,
          status: "processing",
          createdAt: Date.now(),
        },
      ],
    });
    const page = await listTransactions(ctx as never, { limit: 2 });
    expect(page.transactions.map((row) => row.description)).toEqual([
      "visible-b",
      "visible-a",
    ]);
    expect(page.transactions).toHaveLength(2);
    expect(page.isDone).toBe(true);
  });

  it("blocks updateMine and applyTriageMine on hidden import ids", async () => {
    const hidden = txn(1, {
      description: "hidden in-flight",
      importSessionExternalId: "sess-mid",
    });
    const visible = txn(2, { description: "legacy visible" });
    const ctx = fakeCtx({
      transactions: [hidden, visible],
      categories: [],
      importSessions: [
        {
          _id: "importSessions:mid",
          externalId: "sess-mid",
          userId: USER._id,
          status: "processing",
          createdAt: Date.now(),
        },
      ],
      duplicateCandidates: [],
    });
    await expect(
      updateMineHandler(ctx as never, {
        externalId: hidden.externalId,
        notes: "should not stick",
      }),
    ).rejects.toThrow("Transaction not found");
    expect((hidden as Record<string, unknown>).notes).toBeUndefined();

    await expect(
      applyTriageMineHandler(ctx as never, {
        kind: "transaction",
        id: hidden.externalId,
        action: "ignore",
      }),
    ).rejects.toThrow("Transaction not found");
    expect((hidden as Record<string, unknown>).triageIgnoredAt).toBeUndefined();

    const updated = await updateMineHandler(ctx as never, {
      externalId: visible.externalId,
      notes: "ok",
    });
    expect(updated.notes).toBe("ok");
  });

  it("hides duplicate candidates from an in-flight import in triage", async () => {
    const ctx = fakeCtx({
      transactions: [
        txn(1, {
          description: "legacy visible",
          categoryId: "cat:1",
          categoryExternalId: "cat-1",
          confidenceScore: 100,
        }),
      ],
      categories: [
        {
          _id: "cat:1",
          externalId: "cat-1",
          name: "Office",
          categoryType: "expense",
          taxTreatment: "deductible",
        },
      ],
      importSessions: [
        {
          _id: "importSessions:mid",
          externalId: "sess-mid",
          userId: USER._id,
          status: "processing",
          createdAt: Date.now(),
        },
        {
          _id: "importSessions:done",
          externalId: "sess-done",
          userId: USER._id,
          status: "completed",
          createdAt: Date.now(),
        },
      ],
      duplicateCandidates: [
        {
          _id: "dup:mid",
          externalId: "dup-mid",
          userId: USER._id,
          sessionExternalId: "sess-mid",
          status: "pending",
          createdAt: 10,
          payload: {
            merchant: "in-flight dup",
            amount: 12,
            date: "2026-01-02",
            type: "debit",
          },
        },
        {
          _id: "dup:done",
          externalId: "dup-done",
          userId: USER._id,
          sessionExternalId: "sess-done",
          status: "pending",
          createdAt: 11,
          payload: {
            merchant: "completed dup",
            amount: 15,
            date: "2026-01-03",
            type: "debit",
          },
        },
      ],
    });
    const triage = await collectTriage(ctx as never);
    expect(triage.items.map((row) => row.id)).toEqual(["dup-done"]);
    expect(triage.counts.duplicateSuspect).toBe(1);

    await expect(
      applyTriageMineHandler(ctx as never, {
        kind: "duplicate",
        id: "dup-mid",
        action: "ignore",
      }),
    ).rejects.toThrow("Duplicate not found");
  });

  it("expenses: category filter and cursor paging", async () => {
    const cat = "cat-rent";
    const rows = [
      expense(1, { categoryExternalId: cat, date: "2026-03-01" }),
      expense(2, { categoryExternalId: "other", date: "2026-03-02" }),
      expense(3, { categoryExternalId: cat, date: "2026-03-03" }),
      expense(4, { categoryExternalId: cat, date: "2026-03-04" }),
    ];
    const ctx = fakeCtx({ expenses: rows });
    const first = await listExpenses(ctx as never, {
      categoryId: cat,
      limit: 2,
    });
    expect(first.expenses).toHaveLength(2);
    expect(first.isDone).toBe(false);
    const second = await listExpenses(ctx as never, {
      categoryId: cat,
      limit: 2,
      cursor: first.nextCursor,
    });
    expect(second.expenses).toHaveLength(1);
    expect(second.isDone).toBe(true);
    expect([...first.expenses, ...second.expenses].map((row) => row.id)).toEqual([
      rows[3]!.externalId,
      rows[2]!.externalId,
      rows[0]!.externalId,
    ]);
  });

  it("invoices: status index pages without loading every row", async () => {
    const rows = Array.from({ length: 4 }, (_, i) => ({
      _id: `inv:${i}`,
      externalId: `invoice-${i}`,
      userId: USER._id,
      userExternalId: USER.externalId,
      invoiceNumber: `INV-${i}`,
      status: i % 2 === 0 ? "sent" : "draft",
      isImmutable: i % 2 === 0,
      createdAt: 10 + i,
      updatedAt: 10 + i,
    }));
    const ctx = fakeCtx({ invoices: rows, clients: [] });
    const first = await listInvoices(ctx as never, { status: "sent", limit: 1 });
    expect(first.invoices).toHaveLength(1);
    expect(first.invoices[0]?.status).toBe("sent");
    expect(first.isDone).toBe(false);
    const rest = await listInvoices(ctx as never, {
      status: "sent",
      limit: 1,
      cursor: first.nextCursor,
    });
    expect(rest.invoices).toHaveLength(1);
    expect(rest.isDone).toBe(true);
  });
});
