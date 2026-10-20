/** @vitest-environment node */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DISCOUNT_TOO_BIG,
  NEGATIVE_QUANTITY,
  NEGATIVE_UNIT_PRICE,
} from "./lib/line-amounts";

const getCurrentUser = vi.fn();
const userCanAccessClient = vi.fn();
const loadBusinessProfile = vi.fn();

vi.mock("./lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
  userCanAccessClient: (...args: unknown[]) => userCanAccessClient(...args),
}));

vi.mock("./lib/profiles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/profiles")>();
  return {
    ...actual,
    loadBusinessProfile: (...args: unknown[]) => loadBusinessProfile(...args),
  };
});

import { createMineHandler, updateMineHandler } from "./invoices";

const USER = {
  _id: "users:1",
  externalId: "u1",
  email: "ada@example.com",
};

const PROFILE = {
  legalName: "Ada Foods Ltd",
  addressLine1: "14 Marina Road",
  addressLine2: "",
  city: "Lagos",
  state: "",
  country: "NG",
  email: "",
  phone: "",
  tin: "",
  vatNumber: "",
  complete: true,
  logoStorageId: null,
  logoUrl: null,
  logoWidth: null,
  logoHeight: null,
};

function fakeDb() {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    invoices: [],
    invoiceSequences: [],
    invoiceAuditLogs: [],
    clients: [],
  };
  let nextId = 1;
  const queryTable = (table: string) => ({
    withIndex: (_name: string, build?: (q: { eq: (field: string, value: unknown) => unknown }) => void) => {
      const eqs: Array<{ field: string; value: unknown }> = [];
      const q = {
        eq(field: string, value: unknown) {
          eqs.push({ field, value });
          return q;
        },
      };
      build?.(q);
      const match = () =>
        (tables[table] ?? []).filter((row) =>
          eqs.every((clause) => row[clause.field] === clause.value),
        );
      return {
        unique: async () => match()[0] ?? null,
        first: async () => match()[0] ?? null,
        collect: async () => match(),
      };
    },
  });
  return {
    tables,
    db: {
      query: queryTable,
      insert: async (table: string, doc: Record<string, unknown>) => {
        const _id = `${table}:${nextId++}`;
        tables[table] ??= [];
        tables[table]!.push({ _id, ...doc });
        return _id;
      },
      patch: async (id: string, patch: Record<string, unknown>) => {
        for (const rows of Object.values(tables)) {
          const row = rows.find((r) => r._id === id);
          if (row) Object.assign(row, patch);
        }
      },
      get: async (id: string) => {
        for (const rows of Object.values(tables)) {
          const row = rows.find((r) => r._id === id);
          if (row) return row;
        }
        return null;
      },
    },
  };
}

function ctxOf(db: ReturnType<typeof fakeDb>["db"]) {
  return { db } as never;
}

describe("IVA-190 createMine / updateMine server amounts", () => {
  beforeEach(() => {
    getCurrentUser.mockReset().mockResolvedValue(USER);
    userCanAccessClient.mockReset().mockResolvedValue(true);
    loadBusinessProfile.mockReset().mockResolvedValue(PROFILE);
  });

  it("createMine ignores tampered line amounts and totals", async () => {
    const { db, tables } = fakeDb();
    const created = await createMineHandler(ctxOf(db), {
      lineItems: [
        {
          description: "Catering",
          quantity: 1,
          unit_price: 850000,
          vat_rate: 7.5,
          discount: 0,
          amount: 1,
        },
        {
          description: "Delivery",
          quantity: 2,
          unit_price: 25000,
          vat_rate: 0,
          amount: 9,
        },
      ],
      subtotal: 1,
      vatAmount: 0,
      totalAmount: 1,
      taxYear: 2026,
    });

    expect(created.subtotal).toBe(900000);
    expect(created.vat_amount).toBe(63750);
    expect(created.total_amount).toBe(963750);
    expect(created.amount_due).toBe(963750);
    expect(
      (created.line_items as Array<{ amount: number }>).map((line) => line.amount),
    ).toEqual([850000, 50000]);

    const stored = tables.invoices[0]!;
    expect(stored.subtotal).toBe(900000);
    expect(stored.vatAmount).toBe(63750);
    expect(stored.totalAmount).toBe(963750);
    expect(stored.amountDue).toBe(963750);
  });

  it("createMine rejects a negative quantity with friendly copy", async () => {
    const { db } = fakeDb();
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: -2, unit_price: 10, vat_rate: 0, amount: 999 }],
      }),
    ).rejects.toBeInstanceOf(ConvexError);
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: -2, unit_price: 10, vat_rate: 0, amount: 999 }],
      }),
    ).rejects.toMatchObject({
      name: "ConvexError",
      data: `Line item 1: ${NEGATIVE_QUANTITY}`,
    });
  });

  it("createMine rejects a negative rate with friendly copy", async () => {
    const { db } = fakeDb();
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: 1, unit_price: -50, vat_rate: 7.5 }],
      }),
    ).rejects.toMatchObject({
      name: "ConvexError",
      data: `Line item 1: ${NEGATIVE_UNIT_PRICE}`,
    });
  });

  it("createMine rejects a discount bigger than the line", async () => {
    const { db } = fakeDb();
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [
          { description: "Bad", quantity: 2, unit_price: 100, vat_rate: 0, discount: 201 },
        ],
      }),
    ).rejects.toMatchObject({
      name: "ConvexError",
      data: `Line item 1: ${DISCOUNT_TOO_BIG}`,
    });
  });

  it("updateMine recomputes from patched lines and ignores client totals", async () => {
    const { db, tables } = fakeDb();
    await createMineHandler(ctxOf(db), {
      invoiceNumber: "INV-2026-0001",
      taxYear: 2026,
      lineItems: [{ description: "Draft", quantity: 1, unit_price: 10, vat_rate: 0 }],
    });
    const externalId = tables.invoices[0]!.externalId as string;

    const updated = await updateMineHandler(ctxOf(db), {
      externalId,
      patch: {
        title: "Edited",
        subtotal: 1,
        vatAmount: 0,
        totalAmount: 1,
        lineItems: [
          {
            description: "Catering",
            quantity: 1.5,
            unit_price: 33.33,
            vat_rate: 0,
            amount: 1,
          },
          {
            description: "Same again",
            quantity: 1.5,
            unit_price: 33.33,
            vat_rate: 0,
            amount: 1,
          },
        ],
      },
    });

    expect(updated.title).toBe("Edited");
    expect(updated.subtotal).toBe(100);
    expect(updated.vat_amount).toBe(0);
    expect(updated.total_amount).toBe(100);
    expect(
      (updated.line_items as Array<{ amount: number }>).map((line) => line.amount),
    ).toEqual([50, 50]);
    expect(tables.invoices[0]!.totalAmount).toBe(100);
  });

  it("updateMine rejects invalid input on a line patch", async () => {
    const { db, tables } = fakeDb();
    await createMineHandler(ctxOf(db), {
      invoiceNumber: "INV-2026-0002",
      lineItems: [{ description: "Draft", quantity: 1, unit_price: 10, vat_rate: 0 }],
    });
    const externalId = tables.invoices[0]!.externalId as string;

    await expect(
      updateMineHandler(ctxOf(db), {
        externalId,
        patch: {
          lineItems: [{ description: "Bad", quantity: 1, unit_price: -1, vat_rate: 0 }],
        },
      }),
    ).rejects.toMatchObject({
      name: "ConvexError",
      data: `Line item 1: ${NEGATIVE_UNIT_PRICE}`,
    });
  });
});

describe("IVA-190 dead invoice helpers", () => {
  it("removes unused security, archiving and createInvoice", () => {
    expect(existsSync(resolve(process.cwd(), "src/lib/invoice-security.ts"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "src/lib/invoice-archiving.ts"))).toBe(false);
    const service = readFileSync(resolve(process.cwd(), "src/lib/invoice-service.ts"), "utf8");
    expect(service).not.toMatch(/export async function createInvoice\(/);
  });

  it("createMine and updateMine share line-amounts via priceInvoiceLines", () => {
    const source = readFileSync(resolve(process.cwd(), "convex/invoices.ts"), "utf8");
    expect(source).toMatch(/priceInvoiceLines\(args\.lineItems\)/);
    expect(source).toMatch(/priceInvoiceLines\(lineItemsFromPatch/);
    expect(source).not.toMatch(/subtotal: args\.subtotal/);
    expect(source).not.toMatch(/totalAmount: args\.totalAmount/);
  });
});
