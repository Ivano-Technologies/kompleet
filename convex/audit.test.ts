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

import { appendHandler, removeMineHandler } from "./audit";

const OWNER = {
  _id: "users:1",
  externalId: "u1",
  email: "ada@example.com",
  platformRole: "user" as const,
};

const STRANGER = {
  _id: "users:2",
  externalId: "u2",
  email: "other@example.com",
  platformRole: "user" as const,
};

describe("audit:append", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it("requires a signed-in user with a profile (owner of the log)", async () => {
    getCurrentUser.mockRejectedValue(new Error("Not authenticated"));
    const inserted: unknown[] = [];
    const ctx = {
      db: {
        insert: async (_table: string, doc: unknown) => {
          inserted.push(doc);
          return "audit:1";
        },
      },
    };
    await expect(
      appendHandler(ctx as never, { action: "create" }),
    ).rejects.toThrow("Not authenticated");
    expect(inserted).toEqual([]);
  });

  it("writes the row as the current user", async () => {
    getCurrentUser.mockResolvedValue(OWNER);
    const inserted: Array<Record<string, unknown>> = [];
    const ctx = {
      db: {
        insert: async (_table: string, doc: Record<string, unknown>) => {
          inserted.push(doc);
          return "audit:1";
        },
      },
    };
    await expect(
      appendHandler(ctx as never, { action: "create", resourceType: "invoices" }),
    ).resolves.toBe("audit:1");
    expect(inserted).toHaveLength(1);
    expect(inserted[0]?.userId).toBe(OWNER._id);
    expect(inserted[0]?.userExternalId).toBe(OWNER.externalId);
    expect(inserted[0]?.action).toBe("create");
  });
});

describe("audit:removeMine", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it("throws FORBIDDEN when deleting another user's log", async () => {
    getCurrentUser.mockResolvedValue(STRANGER);
    const deleted: string[] = [];
    const ctx = {
      db: {
        get: async () => ({
          _id: "audit:1",
          userId: OWNER._id,
          userExternalId: OWNER.externalId,
          action: "create",
          createdAt: 1,
        }),
        delete: async (id: string) => {
          deleted.push(id);
        },
      },
    };
    await expect(
      removeMineHandler(ctx as never, { id: "audit:1" as never }),
    ).rejects.toMatchObject({ name: "ConvexError", data: "FORBIDDEN" });
    expect(deleted).toEqual([]);
  });

  it("deletes the caller's own log", async () => {
    getCurrentUser.mockResolvedValue(OWNER);
    const deleted: string[] = [];
    const ctx = {
      db: {
        get: async () => ({
          _id: "audit:1",
          userId: OWNER._id,
          userExternalId: OWNER.externalId,
          action: "create",
          createdAt: 1,
        }),
        delete: async (id: string) => {
          deleted.push(id);
        },
      },
    };
    await expect(
      removeMineHandler(ctx as never, { id: "audit:1" as never }),
    ).resolves.toBeNull();
    expect(deleted).toEqual(["audit:1"]);
  });
});
