/** @vitest-environment node */

import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
const getCurrentUserOrNull = vi.fn();

vi.mock("./lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/auth")>();
  return {
    ...actual,
    getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
    getCurrentUserOrNull: (...args: unknown[]) => getCurrentUserOrNull(...args),
  };
});

import {
  apiFullName,
  ensureCurrentHandler,
  listAllHandler,
  verifiedIdentityEmail,
} from "./users";

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

const VICTIM = {
  _id: "users:victim",
  externalId: "ext-victim",
  email: "victim@example.com",
  fullName: "Victim User",
  phone: "",
  entityType: "individual" as const,
  defaultCurrency: "NGN",
  fiscalYearStart: 1,
  onboardingCompleted: false,
  createdAt: 1,
  updatedAt: 1,
};

function fakeDb(seed: Array<Record<string, unknown>> = []) {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    users: seed.map((row) => ({ ...row })),
  };
  let nextId = seed.length + 1;
  const queryTable = (table: string) => ({
    take: async (n: number) => (tables[table] ?? []).slice(0, n),
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
        (tables[table] ?? []).filter((row) =>
          eqs.every((clause) => row[clause.field] === clause.value),
        );
      return {
        unique: async () => match()[0] ?? null,
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
          const row = rows.find((item) => item._id === id);
          if (row) Object.assign(row, patch);
        }
      },
      get: async (id: string) => {
        for (const rows of Object.values(tables)) {
          const row = rows.find((item) => item._id === id);
          if (row) return row;
        }
        return null;
      },
    },
  };
}

function ctxOf(
  db: ReturnType<typeof fakeDb>["db"],
  identity: {
    tokenIdentifier: string;
    subject: string;
    email?: string;
    emailVerified?: boolean | string;
  },
) {
  return {
    db,
    auth: { getUserIdentity: async () => identity },
  } as never;
}

describe("users:listAll", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it("throws FORBIDDEN for a signed-in non-admin", async () => {
    getCurrentUser.mockResolvedValue(MEMBER);
    await expect(
      listAllHandler({ db: fakeDb([OWNER, MEMBER]).db } as never),
    ).rejects.toMatchObject({ name: "ConvexError", data: "FORBIDDEN" });
  });

  it("returns profiles for an owner, omitting deleted users", async () => {
    getCurrentUser.mockResolvedValue(OWNER);
    const deleted = { ...MEMBER, _id: "users:gone", deletedAt: 9 };
    const result = await listAllHandler({
      db: fakeDb([OWNER, MEMBER, deleted]).db,
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
      db: fakeDb([OWNER, MEMBER]).db,
    } as never);
    expect(result).toHaveLength(2);
  });

  it("throws ConvexError rather than a plain Error", async () => {
    getCurrentUser.mockResolvedValue(MEMBER);
    await expect(
      listAllHandler({ db: fakeDb([]).db } as never),
    ).rejects.toBeInstanceOf(ConvexError);
  });
});

describe("apiFullName", () => {
  it("returns fullName, then name, so existing first-name-only rows still work", () => {
    expect(apiFullName({ fullName: "Audit Test", name: "Audit" })).toBe(
      "Audit Test",
    );
    expect(apiFullName({ name: "Audit Test" })).toBe("Audit Test");
    expect(apiFullName({ fullName: "  ", name: "" })).toBeNull();
  });
});

describe("verifiedIdentityEmail", () => {
  it("returns empty when the identity email is not verified", () => {
    expect(
      verifiedIdentityEmail({
        email: "ada@example.com",
        emailVerified: false,
      }),
    ).toBe("");
    expect(verifiedIdentityEmail({ email: "ada@example.com" })).toBe("");
  });

  it("returns the lowercase identity email only when verified", () => {
    expect(
      verifiedIdentityEmail({
        email: "Ada@Example.com",
        emailVerified: true,
      }),
    ).toBe("ada@example.com");
  });
});

describe("ensureCurrentHandler", () => {
  beforeEach(() => {
    getCurrentUserOrNull.mockReset().mockResolvedValue(null);
  });

  it("does not write or reclaim an unverified email onto an existing user", async () => {
    const { db, tables } = fakeDb([VICTIM]);
    const result = await ensureCurrentHandler(
      ctxOf(db, {
        tokenIdentifier: "iss|attacker",
        subject: "attacker",
        email: "victim@example.com",
        emailVerified: false,
      }),
      { email: "victim@example.com", fullName: "Attacker" },
    );

    expect(tables.users).toHaveLength(2);
    expect(tables.users[0]?.email).toBe("victim@example.com");
    expect(tables.users[0]?.tokenIdentifier).toBeUndefined();
    expect(tables.users[1]).toMatchObject({
      email: "",
      externalId: "attacker",
      tokenIdentifier: "iss|attacker",
    });
    expect(result.email).toBe("");
  });

  it("never copies args.email onto a row when the identity has no verified email", async () => {
    const { db, tables } = fakeDb([]);
    const result = await ensureCurrentHandler(
      ctxOf(db, {
        tokenIdentifier: "iss|attacker",
        subject: "attacker",
      }),
      { email: "victim@example.com", fullName: "Attacker" },
    );

    expect(tables.users).toHaveLength(1);
    expect(tables.users[0]?.email).toBe("");
    expect(result.email).toBe("");
  });

  it("does not overwrite an existing session email from unverified args", async () => {
    const sessionUser = {
      ...VICTIM,
      _id: "users:me",
      email: "me@example.com",
      tokenIdentifier: "iss|me",
    };
    getCurrentUserOrNull.mockResolvedValue(sessionUser);
    const { db, tables } = fakeDb([sessionUser]);

    const result = await ensureCurrentHandler(
      ctxOf(db, {
        tokenIdentifier: "iss|me",
        subject: "me",
        email: "me@example.com",
        emailVerified: false,
      }),
      { email: "victim@example.com" },
    );

    expect(tables.users).toHaveLength(1);
    expect(tables.users[0]?.email).toBe("me@example.com");
    expect(result.email).toBe("me@example.com");
  });

  it("returns name as full_name when fullName is missing", async () => {
    const sessionUser = {
      ...VICTIM,
      _id: "users:me",
      email: "me@example.com",
      tokenIdentifier: "iss|me",
      fullName: undefined,
      name: "Audit Test",
    };
    getCurrentUserOrNull.mockResolvedValue(sessionUser);
    const { db } = fakeDb([sessionUser]);

    const result = await ensureCurrentHandler(
      ctxOf(db, {
        tokenIdentifier: "iss|me",
        subject: "me",
        email: "me@example.com",
        emailVerified: true,
      }),
      {},
    );

    expect(result.full_name).toBe("Audit Test");
  });

  it("sets and reclaims the email after the identity is verified", async () => {
    const { db, tables } = fakeDb([VICTIM]);
    const result = await ensureCurrentHandler(
      ctxOf(db, {
        tokenIdentifier: "iss|ada",
        subject: "ada",
        email: "victim@example.com",
        emailVerified: true,
      }),
      { email: "ignored@example.com", fullName: "Ada" },
    );

    expect(tables.users).toHaveLength(1);
    expect(tables.users[0]).toMatchObject({
      _id: "users:victim",
      email: "victim@example.com",
      tokenIdentifier: "iss|ada",
      fullName: "Ada",
    });
    expect(result.email).toBe("victim@example.com");
  });
});
