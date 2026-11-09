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

import { updateByExternalIdHandler } from "./categories";

const USER = {
  _id: "users:1",
  externalId: "u1",
  platformRole: "user" as const,
};

const ADMIN = {
  _id: "users:2",
  externalId: "u2",
  platformRole: "admin" as const,
};

const OWNER = {
  _id: "users:3",
  externalId: "u3",
  platformRole: "owner" as const,
};

function fakeDb() {
  const rows: Array<Record<string, unknown>> = [
    {
      _id: "categories:1",
      externalId: "cat-rent",
      name: "Rent",
      categoryType: "expense",
      taxTreatment: "deductible",
      keywords: ["rent"],
      description: "Office rent",
      isSystem: true,
      updatedAt: 1,
    },
  ];
  return {
    query: () => ({
      withIndex: (
        _name: string,
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
        const match = () =>
          rows.filter((row) =>
            eqs.every((clause) => row[clause.field] === clause.value),
          );
        return {
          unique: async () => match()[0] ?? null,
        };
      },
    }),
    get: async (id: string) => rows.find((row) => row._id === id) ?? null,
    patch: async (id: string, patch: Record<string, unknown>) => {
      const row = rows.find((entry) => entry._id === id);
      if (row) Object.assign(row, patch);
    },
  };
}

describe("categories:updateByExternalId", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it("throws FORBIDDEN for a non-admin editing a shared system category", async () => {
    getCurrentUser.mockResolvedValue(USER);
    await expect(
      updateByExternalIdHandler(
        { db: fakeDb() } as never,
        { externalId: "cat-rent", name: "Hijacked" },
      ),
    ).rejects.toMatchObject({ name: "ConvexError", data: "FORBIDDEN" });
  });

  it("lets an admin rename a shared system category", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    const result = await updateByExternalIdHandler(
      { db: fakeDb() } as never,
      { externalId: "cat-rent", name: "Office rent" },
    );
    expect(result).toMatchObject({
      id: "cat-rent",
      name: "Office rent",
      is_system: true,
    });
  });

  it("lets an owner edit a shared system category", async () => {
    getCurrentUser.mockResolvedValue(OWNER);
    const result = await updateByExternalIdHandler(
      { db: fakeDb() } as never,
      { externalId: "cat-rent", keywords: ["lease", "rent"] },
    );
    expect(result?.keywords).toEqual(["lease", "rent"]);
  });

  it("returns null when the category does not exist", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    await expect(
      updateByExternalIdHandler(
        { db: fakeDb() } as never,
        { externalId: "missing" },
      ),
    ).resolves.toBeNull();
  });

  it("throws ConvexError rather than a plain Error", async () => {
    getCurrentUser.mockResolvedValue(USER);
    await expect(
      updateByExternalIdHandler(
        { db: fakeDb() } as never,
        { externalId: "cat-rent" },
      ),
    ).rejects.toBeInstanceOf(ConvexError);
  });
});
