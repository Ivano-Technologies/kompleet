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

import { listAllHandler } from "./users";

const OWNER = {
  _id: "users:owner",
  externalId: "owner-1",
  email: "owner@example.com",
  phone: "",
  entityType: "individual" as const,
  defaultCurrency: "NGN",
  fiscalYearStart: 1,
  onboardingCompleted: true,
  platformRole: "owner" as const,
  createdAt: 1,
  updatedAt: 1,
};

const MEMBER = {
  _id: "users:member",
  externalId: "user-1",
  email: "ada@example.com",
  fullName: "Ada",
  phone: "0800",
  entityType: "individual" as const,
  tin: "123",
  companyName: "Ada Foods",
  rcNumber: "RC1",
  companyAddress: "Lagos",
  defaultCurrency: "NGN",
  fiscalYearStart: 1,
  onboardingCompleted: true,
  platformRole: "user" as const,
  createdAt: 1,
  updatedAt: 1,
};

function fakeDb(rows: Array<Record<string, unknown>>) {
  return {
    query: (table: string) => {
      const match = table === "users" ? rows : [];
      return {
        take: async (n: number) => match.slice(0, n),
      };
    },
  };
}

describe("users:listAll", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it("throws FORBIDDEN for a signed-in non-admin", async () => {
    getCurrentUser.mockResolvedValue(MEMBER);
    await expect(
      listAllHandler({ db: fakeDb([OWNER, MEMBER]) } as never),
    ).rejects.toMatchObject({ name: "ConvexError", data: "FORBIDDEN" });
  });

  it("returns profiles for an owner, omitting deleted users", async () => {
    getCurrentUser.mockResolvedValue(OWNER);
    const deleted = { ...MEMBER, _id: "users:gone", deletedAt: 9 };
    const result = await listAllHandler({
      db: fakeDb([OWNER, MEMBER, deleted]),
    } as never);
    expect(result.map((row) => row.id).sort()).toEqual(["owner-1", "user-1"]);
    const ada = result.find((row) => row.id === "user-1");
    expect(ada).toMatchObject({
      email: "ada@example.com",
      full_name: "Ada",
      phone: "0800",
      tin: "123",
      company_name: "Ada Foods",
      rc_number: "RC1",
      company_address: "Lagos",
      platform_role: "user",
    });
  });

  it("returns profiles for an admin", async () => {
    getCurrentUser.mockResolvedValue({ ...OWNER, platformRole: "admin" });
    const result = await listAllHandler({
      db: fakeDb([OWNER, MEMBER]),
    } as never);
    expect(result).toHaveLength(2);
  });

  it("throws ConvexError rather than a plain Error", async () => {
    getCurrentUser.mockResolvedValue(MEMBER);
    await expect(
      listAllHandler({ db: fakeDb([]) } as never),
    ).rejects.toBeInstanceOf(ConvexError);
  });
});
