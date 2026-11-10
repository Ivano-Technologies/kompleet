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

import { touchSourcesHandler } from "./tax";

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

function fakeDb() {
  const sources = [
    { _id: "sources:1", externalId: "src-1", updatedAt: 1 },
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
          sources.filter((row) =>
            eqs.every((clause) => (row as Record<string, unknown>)[clause.field] === clause.value),
          );
        return {
          unique: async () => match()[0] ?? null,
        };
      },
      collect: async () => sources,
    }),
    patch: async (id: string, patch: Record<string, unknown>) => {
      const row = sources.find((source) => source._id === id);
      if (row) Object.assign(row, patch);
    },
  };
}

describe("tax:touchSources", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it("throws FORBIDDEN for a non-admin", async () => {
    getCurrentUser.mockResolvedValue(USER);
    await expect(
      touchSourcesHandler({ db: fakeDb() } as never, {}),
    ).rejects.toMatchObject({ name: "ConvexError", data: "FORBIDDEN" });
  });

  it("lets an admin bump a source", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    const db = fakeDb();
    await expect(
      touchSourcesHandler({ db } as never, { sourceExternalId: "src-1" }),
    ).resolves.toEqual({ ok: true, checked: 1, sourceId: "src-1" });
  });

  it("throws ConvexError for a regular user", async () => {
    getCurrentUser.mockResolvedValue(USER);
    await expect(
      touchSourcesHandler({ db: fakeDb() } as never, {
        sourceExternalId: "src-1",
      }),
    ).rejects.toBeInstanceOf(ConvexError);
  });
});
