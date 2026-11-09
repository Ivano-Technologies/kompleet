/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import { EMAIL_VERIFICATION_REQUIRED_AFTER_MS } from "./emailVerified";
import {
  createOrUpdateAuthUser,
  type AuthUserDoc,
  type CreateOrUpdateUserCtx,
} from "./createOrUpdateUser";
import { trustLegacyPasswordAccountHandler } from "../authLegacy";

function fakeUserCtx(users: AuthUserDoc[] = []) {
  const rows = [...users];
  const ctx: CreateOrUpdateUserCtx = {
    db: {
      get: async (id) => rows.find((row) => row._id === id) ?? null,
      patch: async (id, value) => {
        const row = rows.find((item) => item._id === id);
        if (row) Object.assign(row, value);
      },
      insert: async (_table, value) => {
        const id = `users:${rows.length + 1}` as AuthUserDoc["_id"];
        rows.push({ _id: id, ...(value as Omit<AuthUserDoc, "_id">) });
        return id;
      },
      query: () => ({
        withIndex: (
          _name: "email",
          fn: (q: { eq: (field: "email", value: string) => unknown }) => unknown,
        ) => {
          let email = "";
          fn({
            eq(_field: "email", value: string) {
              email = value;
              return this;
            },
          } as { eq: (field: "email", value: string) => unknown });
          return {
            unique: async () =>
              rows.find((row) => row.email === email && !row.deletedAt) ?? null,
          };
        },
      }),
    },
  };
  return { ctx, rows };
}

type AccountRow = {
  _id: string;
  _creationTime: number;
  userId: AuthUserDoc["_id"];
  provider: string;
  providerAccountId: string;
  emailVerified?: string;
};

function fakeLegacyCtx(args: {
  users: Array<AuthUserDoc & { createdAt: number; deletedAt?: number }>;
  accounts: AccountRow[];
}) {
  const users = args.users.map((row) => ({ ...row }));
  const accounts = args.accounts.map((row) => ({ ...row }));
  return {
    ctx: {
      db: {
        get: async (id: string) =>
          users.find((row) => row._id === id) ??
          accounts.find((row) => row._id === id) ??
          null,
        patch: async (id: string, value: Record<string, unknown>) => {
          const user = users.find((row) => row._id === id);
          if (user) Object.assign(user, value);
          const account = accounts.find((row) => row._id === id);
          if (account) Object.assign(account, value);
        },
        query: (table: string) => ({
          withIndex: (
            _name: string,
            fn: (q: {
              eq: (field: string, value: string) => unknown;
            }) => unknown,
          ) => {
            const eqs: Array<{ field: string; value: string }> = [];
            const q = {
              eq(field: string, value: string) {
                eqs.push({ field, value });
                return q;
              },
            };
            fn(q);
            return {
              unique: async () => {
                if (table !== "authAccounts") return null;
                return (
                  accounts.find((row) =>
                    eqs.every(
                      (clause) =>
                        (row as unknown as Record<string, string>)[
                          clause.field
                        ] === clause.value,
                    ),
                  ) ?? null
                );
              },
            };
          },
        }),
      },
    } as never,
    users,
    accounts,
  };
}

const VICTIM: AuthUserDoc & { createdAt: number } = {
  _id: "users:victim" as AuthUserDoc["_id"],
  email: "victim@example.com",
  name: "Victim",
  fullName: "Victim User",
  companyName: "Victim Co",
  externalId: "ext-victim",
  createdAt: EMAIL_VERIFICATION_REQUIRED_AFTER_MS - 86_400_000,
};

describe("takeover-proof", () => {
  it("blocks attaching an unverified password signup to a pre-cutoff user", async () => {
    const { ctx, rows } = fakeUserCtx([VICTIM]);
    const now = EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 1_000;
    const tempId = await createOrUpdateAuthUser(
      ctx,
      {
        existingUserId: null,
        type: "credentials",
        profile: {
          email: "victim@example.com",
          name: "Attacker",
          companyName: "Stolen Ltd",
        },
      },
      now,
    );

    expect(tempId).not.toBe(VICTIM._id);
    expect(rows[0]).toMatchObject({
      _id: VICTIM._id,
      email: "victim@example.com",
      name: "Victim",
      companyName: "Victim Co",
    });
    expect(rows[0]?.emailVerificationTime).toBeUndefined();
    expect(rows[1]?.name).toBe("Attacker");
    expect(rows[1]?.email).toMatch(/^unverified\+/);
    expect(rows[1]?.emailVerificationTime).toBeUndefined();
  });

  it("does not grandfather a login created after the cutoff onto a pre-cutoff user row", async () => {
    const { ctx, accounts, users } = fakeLegacyCtx({
      users: [VICTIM],
      accounts: [
        {
          _id: "accounts:new",
          _creationTime: EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 5_000,
          userId: VICTIM._id,
          provider: "password",
          providerAccountId: "victim@example.com",
        },
      ],
    });

    await trustLegacyPasswordAccountHandler(ctx, {
      email: "victim@example.com",
    });

    expect(accounts[0]?.emailVerified).toBeUndefined();
    expect(users[0]?.emailVerificationTime).toBeUndefined();
  });

  it("still trusts a password login that existed before the cutoff", async () => {
    const { ctx, accounts, users } = fakeLegacyCtx({
      users: [VICTIM],
      accounts: [
        {
          _id: "accounts:old",
          _creationTime: EMAIL_VERIFICATION_REQUIRED_AFTER_MS - 5_000,
          userId: VICTIM._id,
          provider: "password",
          providerAccountId: "victim@example.com",
        },
      ],
    });

    await trustLegacyPasswordAccountHandler(ctx, {
      email: "victim@example.com",
    });

    expect(accounts[0]?.emailVerified).toBe("victim@example.com");
    expect(users[0]?.emailVerificationTime).toBe(
      EMAIL_VERIFICATION_REQUIRED_AFTER_MS - 5_000,
    );
  });

  it("reclaims the real user only after the email OTP succeeds", async () => {
    const temp: AuthUserDoc = {
      _id: "users:temp" as AuthUserDoc["_id"],
      email: "unverified+temp@invalid.local",
      name: "Ada Okonkwo",
      externalId: "ext-temp",
    };
    const { ctx, rows } = fakeUserCtx([VICTIM, temp]);
    const now = EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 2_000;
    const id = await createOrUpdateAuthUser(
      ctx,
      {
        existingUserId: temp._id,
        type: "verification",
        profile: {
          email: "victim@example.com",
          emailVerified: true,
          name: "Ada Okonkwo",
        },
      },
      now,
    );
    expect(id).toBe(VICTIM._id);
    expect(rows[0]?.emailVerificationTime).toBe(now);
    expect(rows[0]?.name).toBe("Ada Okonkwo");
    expect(rows[1]?.deletedAt).toBe(now);
  });
});
