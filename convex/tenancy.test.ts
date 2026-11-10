/** @vitest-environment node */

import { ConvexError } from "convex/values";
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
  assertLogoStorageAssignableHandler,
  discardInvalidLogoUpload,
  saveMyBusinessLogoHandler,
} from "./tenancy";

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

function fakeCtx(opts: {
  uploadedFiles?: Array<Record<string, unknown>>;
  expenses?: Array<Record<string, unknown>>;
  users?: Array<Record<string, unknown>>;
  businessProfiles?: Array<Record<string, unknown>>;
  documents?: Array<Record<string, unknown>>;
  importSessions?: Array<Record<string, unknown>>;
  exportHistory?: Array<Record<string, unknown>>;
}) {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    uploadedFiles: opts.uploadedFiles ?? [],
    expenses: opts.expenses ?? [],
    users: opts.users ?? [],
    businessProfiles: opts.businessProfiles ?? [],
    documents: opts.documents ?? [],
    importSessions: opts.importSessions ?? [],
    exportHistory: opts.exportHistory ?? [],
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
      return {
        first: async () => rows()[0] ?? null,
        unique: async () => rows()[0] ?? null,
        collect: async () => rows(),
      };
    },
  });
  return {
    db: { query: queryTable },
  };
}

describe("tenancy:setMyBusinessLogo storage ownership", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it("does not delete another tenant's blob when the action would discard an invalid logo", async () => {
    const deleted: string[] = [];
    const ctx = {
      runQuery: async () => {
        throw new ConvexError("FORBIDDEN");
      },
      storage: {
        delete: async (id: string) => {
          deleted.push(id);
        },
      },
    };
    await expect(
      discardInvalidLogoUpload(ctx as never, "kg-victim" as never),
    ).rejects.toMatchObject({ name: "ConvexError", data: "FORBIDDEN" });
    expect(deleted).toEqual([]);
  });

  it("forbids a stranger from asserting assignability of another tenant's uploaded file", async () => {
    getCurrentUser.mockResolvedValue(STRANGER);
    const ctx = fakeCtx({
      uploadedFiles: [{ storageId: "kg-victim", userId: OWNER._id }],
    });
    await expect(
      assertLogoStorageAssignableHandler(ctx as never, {
        storageId: "kg-victim" as never,
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: "FORBIDDEN" });
  });

  it("forbids saveMyBusinessLogo from adopting another tenant's uploaded file as a logo", async () => {
    getCurrentUser.mockResolvedValue(STRANGER);
    const ctx = fakeCtx({
      uploadedFiles: [{ storageId: "kg-victim", userId: OWNER._id }],
    });
    await expect(
      saveMyBusinessLogoHandler(ctx as never, {
        storageId: "kg-victim" as never,
        width: 64,
        height: 64,
      }),
    ).rejects.toMatchObject({ name: "ConvexError", data: "FORBIDDEN" });
  });
});
