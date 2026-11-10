/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();

vi.mock("./lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/auth")>();
  return {
    ...actual,
    getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
  };
});

import {
  getUrlHandler,
  resolveLinkLabel,
  searchLinkTargetsHandler,
} from "./files";

const OWNER = {
  _id: "users:1",
  externalId: "u1",
  email: "ada@example.com",
  platformRole: "user" as const,
  avatarStorageId: undefined as string | undefined,
};

const STRANGER = {
  _id: "users:2",
  externalId: "u2",
  email: "other@example.com",
  platformRole: "user" as const,
  avatarStorageId: undefined as string | undefined,
};

const ADMIN = {
  _id: "users:3",
  externalId: "u3",
  email: "admin@example.com",
  platformRole: "admin" as const,
  avatarStorageId: undefined as string | undefined,
};

function fakeCtx(opts: {
  uploadedFiles?: Array<Record<string, unknown>>;
  expenses?: Array<Record<string, unknown>>;
  users?: Array<Record<string, unknown>>;
  businessProfiles?: Array<Record<string, unknown>>;
  documents?: Array<Record<string, unknown>>;
  importSessions?: Array<Record<string, unknown>>;
  exportHistory?: Array<Record<string, unknown>>;
  transactions?: Array<Record<string, unknown>>;
}) {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    uploadedFiles: opts.uploadedFiles ?? [],
    expenses: opts.expenses ?? [],
    users: opts.users ?? [],
    businessProfiles: opts.businessProfiles ?? [],
    documents: opts.documents ?? [],
    importSessions: opts.importSessions ?? [],
    exportHistory: opts.exportHistory ?? [],
    transactions: opts.transactions ?? [],
  };
  const indexFields: Record<string, string[]> = {
    by_storageId: ["storageId"],
    by_receiptStorageId: ["receiptStorageId"],
    by_user: ["userId"],
    by_logoStorageId: ["logoStorageId"],
    by_avatarStorageId: ["avatarStorageId"],
  };
  const queryTable = (table: string) => ({
    withIndex: (
      name: string,
      build?: (q: { eq: (field: string, value: unknown) => unknown }) => void,
    ) => {
      const eqs: Array<{ field: string; value: unknown }> = [];
      const q = {
        eq(field: string, value: unknown) {
          eqs.push({ field, value });
          return q;
        },
      };
      build?.(q);
      const fields = indexFields[name] ?? eqs.map((clause) => clause.field);
      const match = () =>
        (tables[table] ?? []).filter((row) =>
          eqs.every((clause, i) => {
            const field = clause.field || fields[i];
            return row[field] === clause.value;
          }),
        );
      const rows = () => match();
      const terminal = {
        first: async () => rows()[0] ?? null,
        unique: async () => rows()[0] ?? null,
        collect: async () => rows(),
        take: async (n: number) => rows().slice(0, n),
        order: () => terminal,
      };
      return terminal;
    },
  });
  return {
    db: { query: queryTable },
    storage: {
      getUrl: async (storageId: string) => `https://files.test/${storageId}`,
    },
  };
}

describe("files:getUrl", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it("returns the URL for the owner of an uploaded file", async () => {
    getCurrentUser.mockResolvedValue(OWNER);
    const ctx = fakeCtx({
      uploadedFiles: [
        { storageId: "kg1", userId: OWNER._id },
      ],
    });
    await expect(
      getUrlHandler(ctx as never, { storageId: "kg1" as never }),
    ).resolves.toBe("https://files.test/kg1");
  });

  it("returns null when another signed-in user asks for that storage id", async () => {
    getCurrentUser.mockResolvedValue(STRANGER);
    const ctx = fakeCtx({
      uploadedFiles: [
        { storageId: "kg1", userId: OWNER._id },
      ],
    });
    await expect(
      getUrlHandler(ctx as never, { storageId: "kg1" as never }),
    ).resolves.toBeNull();
  });

  it("returns the URL for a platform admin", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    const ctx = fakeCtx({
      uploadedFiles: [
        { storageId: "kg1", userId: OWNER._id },
      ],
    });
    await expect(
      getUrlHandler(ctx as never, { storageId: "kg1" as never }),
    ).resolves.toBe("https://files.test/kg1");
  });

  it("returns the URL for the owner's avatar", async () => {
    getCurrentUser.mockResolvedValue({ ...OWNER, avatarStorageId: "kg-av" });
    const ctx = fakeCtx({});
    await expect(
      getUrlHandler(ctx as never, { storageId: "kg-av" as never }),
    ).resolves.toBe("https://files.test/kg-av");
  });
});

describe("files:searchLinkTargets / resolveLinkLabel", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    getCurrentUser.mockResolvedValue(OWNER);
  });

  function importRows() {
    return {
      transactions: [
        {
          _id: "tx:legacy",
          externalId: "tx-legacy",
          userId: OWNER._id,
          description: "legacy visible",
          amount: 10,
          transactionDate: "2026-01-01",
        },
        {
          _id: "tx:mid",
          externalId: "tx-processing",
          userId: OWNER._id,
          description: "in-flight import",
          amount: 20,
          transactionDate: "2026-01-02",
          importSessionExternalId: "sess-mid",
        },
        {
          _id: "tx:fail",
          externalId: "tx-failed",
          userId: OWNER._id,
          description: "failed import leftover",
          amount: 30,
          transactionDate: "2026-01-03",
          importSessionExternalId: "sess-fail",
        },
        {
          _id: "tx:done",
          externalId: "tx-done",
          userId: OWNER._id,
          description: "completed import",
          amount: 40,
          transactionDate: "2026-01-04",
          importSessionExternalId: "sess-done",
        },
      ],
      importSessions: [
        {
          _id: "importSessions:mid",
          externalId: "sess-mid",
          userId: OWNER._id,
          status: "processing",
        },
        {
          _id: "importSessions:fail",
          externalId: "sess-fail",
          userId: OWNER._id,
          status: "failed",
        },
        {
          _id: "importSessions:done",
          externalId: "sess-done",
          userId: OWNER._id,
          status: "completed",
        },
      ],
    };
  }

  it("omits processing and failed import rows from link search", async () => {
    const ctx = fakeCtx(importRows());
    const found = await searchLinkTargetsHandler(ctx as never, {
      linkType: "transaction",
      limit: 20,
    });
    expect(found.map((row) => row.id)).toEqual(["tx-legacy", "tx-done"]);
    expect(found.map((row) => row.label)).toEqual([
      "legacy visible",
      "completed import",
    ]);
    expect(found.some((row) => row.id === "tx-processing")).toBe(false);
    expect(found.some((row) => row.amount === 20)).toBe(false);
  });

  it("treats a hidden import row as not found when resolving a link label", async () => {
    const ctx = fakeCtx(importRows());
    await expect(
      resolveLinkLabel(ctx as never, OWNER._id as never, "transaction", "tx-processing"),
    ).rejects.toThrow("Transaction not found");
    await expect(
      resolveLinkLabel(ctx as never, OWNER._id as never, "transaction", "tx-failed"),
    ).rejects.toThrow("Transaction not found");
    await expect(
      resolveLinkLabel(ctx as never, OWNER._id as never, "transaction", "tx-done"),
    ).resolves.toBe("completed import");
    await expect(
      resolveLinkLabel(ctx as never, OWNER._id as never, "transaction", "tx-legacy"),
    ).resolves.toBe("legacy visible");
  });
});
