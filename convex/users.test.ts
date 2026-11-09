/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ensureCurrentHandler,
  verifiedIdentityEmail,
} from "./users";

const getCurrentUserOrNull = vi.fn();

vi.mock("./lib/auth", () => ({
  getCurrentUserOrNull: (...args: unknown[]) => getCurrentUserOrNull(...args),
  getCurrentUser: vi.fn(),
  supabaseSubject: (identity: { subject: string }) => identity.subject,
}));

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
