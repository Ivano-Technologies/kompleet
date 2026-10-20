/** @vitest-environment node */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADD_ITEM_BEFORE_ISSUE,
  ALREADY_ISSUED,
  DISCOUNT_TOO_BIG,
  STATUS_VIA_UPDATE,
  INVALID_QUANTITY,
  INVALID_UNIT_PRICE,
  NEGATIVE_QUANTITY,
  NEGATIVE_UNIT_PRICE,
  VAT_RATE_RANGE,
} from "./lib/lineAmounts";

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

import { createMineHandler, issueMineHandler, updateMineHandler } from "./invoices";

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
      data: NEGATIVE_QUANTITY,
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
      data: NEGATIVE_UNIT_PRICE,
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
      data: DISCOUNT_TOO_BIG,
    });
  });

  it("createMine rejects a VAT rate outside 0 to 100", async () => {
    const { db } = fakeDb();
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: 1, unit_price: 10, vat_rate: 500 }],
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: VAT_RATE_RANGE });
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: 1, unit_price: 10, vat_rate: -100 }],
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: VAT_RATE_RANGE });
  });

  it("createMine rejects a non-finite quantity or unit price", async () => {
    const { db } = fakeDb();
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: Number.NaN, unit_price: 10, vat_rate: 0 }],
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: INVALID_QUANTITY });
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: 1, unit_price: "10", vat_rate: 0 }],
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: INVALID_UNIT_PRICE });
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: 1, unit_price: null, vat_rate: 0 }],
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: INVALID_UNIT_PRICE });
    await expect(
      createMineHandler(ctxOf(db), {
        lineItems: [{ description: "Bad", quantity: Number.POSITIVE_INFINITY, unit_price: 10, vat_rate: 0 }],
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: INVALID_QUANTITY });
  });

  it("createMine strips client-sent amount fields from stored lines", async () => {
    const { db, tables } = fakeDb();
    await createMineHandler(ctxOf(db), {
      lineItems: [
        {
          description: "Catering",
          quantity: 1,
          unit_price: 100,
          vat_rate: 0,
          amount: 1,
          lineTotal: 9,
          vatAmount: 8,
          subtotal: 7,
          total: 6,
        },
      ],
    });
    const stored = (tables.invoices[0]!.lineItems as Array<Record<string, unknown>>)[0]!;
    expect(stored.amount).toBe(100);
    expect(stored).not.toHaveProperty("lineTotal");
    expect(stored).not.toHaveProperty("vatAmount");
    expect(stored).not.toHaveProperty("subtotal");
    expect(stored).not.toHaveProperty("total");
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
      data: NEGATIVE_UNIT_PRICE,
    });
  });

  it("updateMine leaves stored totals when there are no line items", async () => {
    const { db, tables } = fakeDb();
    await createMineHandler(ctxOf(db), {
      invoiceNumber: "INV-2026-0003",
      title: "Empty draft",
    });
    tables.invoices[0]!.subtotal = 250;
    tables.invoices[0]!.vatAmount = 18.75;
    tables.invoices[0]!.totalAmount = 268.75;
    tables.invoices[0]!.amountDue = 268.75;
    const externalId = tables.invoices[0]!.externalId as string;

    const updated = await updateMineHandler(ctxOf(db), {
      externalId,
      patch: { title: "Still empty", lineItems: [] },
    });
    expect(updated.title).toBe("Still empty");
    expect(updated.subtotal).toBe(250);
    expect(updated.vat_amount).toBe(18.75);
    expect(updated.total_amount).toBe(268.75);
    expect(tables.invoices[0]!.subtotal).toBe(250);
  });

  it("updateMine does not reprice when only title, notes or client change", async () => {
    const { db, tables } = fakeDb();
    await createMineHandler(ctxOf(db), {
      invoiceNumber: "INV-2026-0004",
      lineItems: [{ description: "Draft", quantity: 1, unit_price: 10, vat_rate: 0 }],
    });
    tables.invoices[0]!.lineItems = [
      { description: "Bad stored line", quantity: -2, unit_price: 10, vat_rate: 0, amount: 1 },
    ];
    tables.invoices[0]!.subtotal = 99;
    tables.invoices[0]!.totalAmount = 99;
    const externalId = tables.invoices[0]!.externalId as string;

    const updated = await updateMineHandler(ctxOf(db), {
      externalId,
      patch: { title: "Keep the bad line", notes: "edit only" },
    });
    expect(updated.title).toBe("Keep the bad line");
    expect(updated.subtotal).toBe(99);
    expect(updated.total_amount).toBe(99);
    expect((tables.invoices[0]!.lineItems as Array<{ quantity: number }>)[0]!.quantity).toBe(-2);
  });

  it("updateMine rejects status issued or any other status on an empty draft", async () => {
    const { db, tables } = fakeDb();
    await createMineHandler(ctxOf(db), {
      invoiceNumber: "INV-2026-0005",
      title: "Empty draft",
    });
    tables.invoices[0]!.subtotal = 250;
    tables.invoices[0]!.totalAmount = 250;
    const externalId = tables.invoices[0]!.externalId as string;

    await expect(
      updateMineHandler(ctxOf(db), {
        externalId,
        patch: { status: "issued" },
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: STATUS_VIA_UPDATE });
    await expect(
      updateMineHandler(ctxOf(db), {
        externalId,
        patch: { status: "paid" },
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: STATUS_VIA_UPDATE });
    await expect(
      updateMineHandler(ctxOf(db), {
        externalId,
        patch: { status: "cancelled" },
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: STATUS_VIA_UPDATE });

    expect(tables.invoices[0]!.status).toBe("draft");
    expect(tables.invoices[0]!.isImmutable).toBe(false);
    expect(tables.invoices[0]!.subtotal).toBe(250);
    expect(tables.invoices[0]!.totalAmount).toBe(250);
  });
});

describe("IVA-190 issueMine", () => {
  beforeEach(() => {
    getCurrentUser.mockReset().mockResolvedValue(USER);
    userCanAccessClient.mockReset().mockResolvedValue(true);
    loadBusinessProfile.mockReset().mockResolvedValue(PROFILE);
  });

  async function seedDraftWithClient(
    db: ReturnType<typeof fakeDb>["db"],
    tables: ReturnType<typeof fakeDb>["tables"],
    lineItems?: unknown,
  ) {
    tables.clients.push({
      _id: "clients:1",
      externalId: "c1",
      legalName: "Acme Ltd",
      addressLine1: "1 Marina",
      city: "Lagos",
      country: "NG",
    });
    await createMineHandler(ctxOf(db), {
      invoiceNumber: "INV-2026-0099",
      clientExternalId: "c1",
      lineItems,
    });
    return tables.invoices[0]!;
  }

  it("reprices from lines before issuing so tampered stored totals are corrected", async () => {
    const { db, tables } = fakeDb();
    const row = await seedDraftWithClient(db, tables, [
      { description: "Catering", quantity: 1, unit_price: 850000, vat_rate: 7.5 },
      { description: "Delivery", quantity: 2, unit_price: 25000, vat_rate: 0 },
    ]);
    row.subtotal = 1;
    row.vatAmount = 0;
    row.totalAmount = 1;
    row.amountDue = 1;
    (row.lineItems as Array<Record<string, unknown>>)[0]!.amount = 9;

    const issued = await issueMineHandler(ctxOf(db), { externalId: row.externalId as string });
    expect(issued.status).toBe("issued");
    expect(issued.subtotal).toBe(900000);
    expect(issued.vat_amount).toBe(63750);
    expect(issued.total_amount).toBe(963750);
    expect(tables.invoices[0]!.totalAmount).toBe(963750);
    expect(
      (tables.invoices[0]!.lineItems as Array<{ amount: number }>).map((line) => line.amount),
    ).toEqual([850000, 50000]);
  });

  it("rejects an invoice that is already issued", async () => {
    const { db, tables } = fakeDb();
    const row = await seedDraftWithClient(db, tables, [
      { description: "Done", quantity: 1, unit_price: 10, vat_rate: 0 },
    ]);
    row.status = "issued";
    row.isImmutable = true;
    await expect(
      issueMineHandler(ctxOf(db), { externalId: row.externalId as string }),
    ).rejects.toMatchObject({ name: "ConvexError", data: ALREADY_ISSUED });
  });

  it("rejects issuing when there are no line items", async () => {
    const { db, tables } = fakeDb();
    const row = await seedDraftWithClient(db, tables, []);
    row.subtotal = 250;
    row.totalAmount = 250;
    await expect(
      issueMineHandler(ctxOf(db), { externalId: row.externalId as string }),
    ).rejects.toMatchObject({ name: "ConvexError", data: ADD_ITEM_BEFORE_ISSUE });
    expect(tables.invoices[0]!.subtotal).toBe(250);
    expect(tables.invoices[0]!.status).toBe("draft");
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
    expect(source).toMatch(/patchIncludesLines\(patch\)/);
    expect(source).not.toMatch(/subtotal: args\.subtotal/);
    expect(source).not.toMatch(/totalAmount: args\.totalAmount/);
    expect(source).not.toMatch(/status: typeof patch\.status/);
    expect(source).toMatch(/STATUS_VIA_UPDATE/);
    expect(source).toMatch(/patch: v\.object\(\{/);
    expect(source).not.toMatch(/patch: v\.any\(\)/);
  });

  it("invoice updateMine callers do not send status", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/invoices/[id]/route.ts"),
      "utf8",
    );
    const start = route.indexOf("api.invoices.updateMine");
    expect(start).toBeGreaterThan(-1);
    const call = route.slice(start, route.indexOf("});", start));
    expect(call).not.toMatch(/\bstatus\b/);
  });
});
