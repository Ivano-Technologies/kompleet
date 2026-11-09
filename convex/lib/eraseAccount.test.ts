/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  ACCOUNT_ERASED_ACTION,
  ANON_NAME,
  DELETE_ACCOUNT_PHRASE,
  anonymiseArchiveSnapshot,
  anonymisedEmail,
  eraseMineHandler,
  shouldKeepInvoice,
} from "./eraseAccount";

function fakeDb() {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    invoices: [],
    invoiceArchives: [],
    invoiceAuditLogs: [],
    clients: [],
    clientKeys: [],
    firms: [],
    firmMembers: [],
    uploadedFiles: [],
    documents: [],
    expenses: [],
    exportHistory: [],
    importSessions: [],
    importErrors: [],
    transactions: [],
    taxCalculations: [],
    financialStatements: [],
    taxReports: [],
    userTaxYears: [],
    duplicateCandidates: [],
    expenseCategories: [],
    filingAuditLogs: [],
    nrsForms: [],
    formFilingStatuses: [],
    businessProfiles: [],
    auditLogs: [],
    authSessions: [],
    authRefreshTokens: [],
    authAccounts: [],
    authVerificationCodes: [],
    authRateLimits: [],
    users: [],
    deadlineReminders: [],
  };
  let nextId = 1;
  const storageDeleted: string[] = [];
  const queryTable = (table: string) => ({
    withIndex: (
      _name: string,
      build?: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
    ) => {
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
  const ctx = {
    tables,
    storageDeleted,
    db: {
      query: queryTable,
      get: async (id: string) => {
        for (const rows of Object.values(tables)) {
          const row = rows.find((r) => r._id === id);
          if (row) return row;
        }
        return null;
      },
      insert: async (table: string, doc: Record<string, unknown>) => {
        const _id = `${table}:${nextId++}`;
        tables[table] ??= [];
        tables[table].push({ _id, ...doc });
        return _id;
      },
      patch: async (id: string, patch: Record<string, unknown>) => {
        for (const rows of Object.values(tables)) {
          const row = rows.find((r) => r._id === id);
          if (row) Object.assign(row, patch);
        }
      },
      delete: async (id: string) => {
        for (const table of Object.keys(tables)) {
          tables[table] = tables[table].filter((row) => row._id !== id);
        }
      },
    },
    storage: {
      delete: async (id: string) => {
        storageDeleted.push(id);
      },
    },
  };
  return ctx;
}

function asCtx(db: ReturnType<typeof fakeDb>): MutationCtx {
  return db as unknown as MutationCtx;
}

const USER = {
  _id: "users:1",
  externalId: "u1",
  email: "ada@example.com",
  fullName: "Ada Okonkwo",
  name: "Ada Okonkwo",
  phone: "08012345678",
  tin: "12345678-0001",
  companyName: "Ada Foods",
  rcNumber: "RC123",
  companyAddress: "14 Marina",
  avatarStorageId: "storage:avatar",
} as unknown as Doc<"users">;

describe("shouldKeepInvoice", () => {
  it("keeps issued and cancelled, deletes drafts", () => {
    expect(shouldKeepInvoice("draft")).toBe(false);
    expect(shouldKeepInvoice("issued")).toBe(true);
    expect(shouldKeepInvoice("cancelled")).toBe(true);
    expect(shouldKeepInvoice("paid")).toBe(true);
  });
});

describe("anonymiseArchiveSnapshot", () => {
  it("replaces buyer and seller fields", () => {
    const out = anonymiseArchiveSnapshot({
      invoice: {
        customer_info: { name: "Bolu", email: "bolu@example.com" },
        sender: { name: "Ada Foods", email: "ada@example.com" },
        total: 500,
      },
    }) as { invoice: { customer_info: { name: string }; total: number } };
    expect(out.invoice.customer_info.name).toBe(ANON_NAME);
    expect(out.invoice.total).toBe(500);
  });
});

describe("eraseMineHandler", () => {
  it("anonymises issued invoices, deletes drafts, and writes an audit row", async () => {
    const db = fakeDb();
    db.tables.users.push({ ...USER });
    db.tables.invoices.push(
      {
        _id: "invoices:draft",
        userId: USER._id,
        status: "draft",
        invoiceNumber: "INV-1",
        customerInfo: { name: "Draft client" },
      },
      {
        _id: "invoices:issued",
        userId: USER._id,
        status: "issued",
        invoiceNumber: "INV-2",
        clientId: "clients:1",
        customerInfo: { name: "Bolu", email: "bolu@example.com" },
        senderSnapshot: { name: "Ada Foods", email: "ada@example.com" },
        notes: "Personal note",
      },
    );
    db.tables.invoiceArchives.push({
      _id: "invoiceArchives:1",
      invoiceId: "invoices:issued",
      snapshot: {
        invoice: {
          customer_info: { name: "Bolu" },
          sender: { name: "Ada Foods" },
        },
      },
    });
    db.tables.invoiceAuditLogs.push({
      _id: "invoiceAuditLogs:draft",
      invoiceId: "invoices:draft",
      userId: USER._id,
    });
    db.tables.uploadedFiles.push({
      _id: "uploadedFiles:1",
      userId: USER._id,
      storageId: "storage:file",
    });
    db.tables.businessProfiles.push({
      _id: "businessProfiles:1",
      userId: USER._id,
      legalName: "Ada Foods",
      logoStorageId: "storage:logo",
    });
    db.tables.authSessions.push({
      _id: "authSessions:1",
      userId: USER._id,
    });
    db.tables.authRefreshTokens.push({
      _id: "authRefreshTokens:1",
      sessionId: "authSessions:1",
    });
    db.tables.authAccounts.push({
      _id: "authAccounts:1",
      userId: USER._id,
      provider: "password",
    });
    db.tables.auditLogs.push({
      _id: "auditLogs:old",
      userExternalId: USER.externalId,
      action: "login",
    });
    db.tables.deadlineReminders.push({
      _id: "deadlineReminders:1",
      userId: USER._id,
      formType: "PIT",
      taxYear: 2026,
    });

    const result = await eraseMineHandler(asCtx(db), USER);

    expect(result).toEqual({ erased: true, keptInvoices: 1 });
    expect(db.tables.invoices.map((row) => row._id)).toEqual(["invoices:issued"]);
    const kept = db.tables.invoices[0]!;
    expect(kept.customerInfo).toEqual({
      name: ANON_NAME,
      email: "",
      phone: "",
    });
    expect(kept.senderSnapshot).toEqual({
      name: ANON_NAME,
      email: "",
      phone: "",
    });
    expect(kept.notes).toBeUndefined();
    expect(db.tables.invoiceAuditLogs).toHaveLength(0);
    expect(db.tables.uploadedFiles).toHaveLength(0);
    expect(db.storageDeleted).toEqual(
      expect.arrayContaining(["storage:file", "storage:logo", "storage:avatar"]),
    );
    expect(db.tables.businessProfiles).toHaveLength(0);
    expect(db.tables.authSessions).toHaveLength(0);
    expect(db.tables.authAccounts).toHaveLength(0);
    expect(db.tables.authRefreshTokens).toHaveLength(0);
    expect(db.tables.deadlineReminders).toHaveLength(0);
    expect(db.tables.auditLogs).toHaveLength(1);
    expect(db.tables.auditLogs[0]?.action).toBe(ACCOUNT_ERASED_ACTION);
    expect(db.tables.auditLogs[0]?.userExternalId).toBe("u1");
    const patched = db.tables.users[0]!;
    expect(patched.email).toBe(anonymisedEmail("u1"));
    expect(patched.fullName).toBe(ANON_NAME);
    expect(patched.phone).toBe("");
    expect(patched.tin).toBeUndefined();
    expect(patched.deletedAt).toEqual(expect.any(Number));
  });

  it("does not keep another user's invoices", async () => {
    const db = fakeDb();
    db.tables.invoices.push({
      _id: "invoices:other",
      userId: "users:2",
      status: "issued",
      customerInfo: { name: "Keep me" },
    });
    await eraseMineHandler(asCtx(db), USER);
    expect(db.tables.invoices).toHaveLength(1);
    expect(db.tables.invoices[0]?.customerInfo).toEqual({ name: "Keep me" });
  });
});

describe("delete phrase", () => {
  it("is sentence case with no dashes", () => {
    expect(DELETE_ACCOUNT_PHRASE).toBe("delete my account");
    expect(DELETE_ACCOUNT_PHRASE).not.toMatch(/-/);
  });
});
