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

import { getUrlHandler } from "./files";

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
