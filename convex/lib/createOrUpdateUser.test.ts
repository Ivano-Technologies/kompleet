/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  createOrUpdateAuthUser,
  mergeStoredFullName,
  profileEmailIsVerified,
  type AuthUserDoc,
  type CreateOrUpdateUserCtx,
} from "./createOrUpdateUser";

function fakeCtx(users: AuthUserDoc[] = []) {
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
              rows.find((row) => row.email === email) ?? null,
          };
        },
      }),
    },
  };
  return { ctx, rows };
}

const OLD_USER: AuthUserDoc = {
  _id: "users:old" as AuthUserDoc["_id"],
  email: "ada@example.com",
  name: "Ada",
  fullName: "Ada Lovelace",
  externalId: "ext-old",
  supabaseUserId: undefined,
};

describe("mergeStoredFullName", () => {
  it("keeps an existing full name and upgrades a first-name-only leftover", () => {
    expect(mergeStoredFullName("Audit Test", "Audit")).toBe("Audit Test");
    expect(mergeStoredFullName("Audit", "Audit Test")).toBe("Audit Test");
    expect(mergeStoredFullName(undefined, "Audit Test")).toBe("Audit Test");
    expect(mergeStoredFullName("Audit", undefined)).toBe("Audit");
  });
});

describe("profileEmailIsVerified", () => {
  it("treats verification as verified unless emailVerified is false", () => {
    expect(profileEmailIsVerified("verification")).toBe(true);
    expect(profileEmailIsVerified("verification", true)).toBe(true);
    expect(profileEmailIsVerified("verification", false)).toBe(false);
  });

  it("does not treat sending an email OTP as verified", () => {
    expect(profileEmailIsVerified("email")).toBe(false);
    expect(profileEmailIsVerified("credentials")).toBe(false);
    expect(profileEmailIsVerified("credentials", true)).toBe(true);
  });
});

describe("createOrUpdateAuthUser", () => {
  it("inserts a temp user on unverified signup instead of attaching to the existing row", async () => {
    const { ctx, rows } = fakeCtx([OLD_USER]);
    const now = 1_700_000_000_000;
    const id = await createOrUpdateAuthUser(
      ctx,
      {
        existingUserId: null,
        type: "credentials",
        profile: { email: "ada@example.com", name: "Ada Okonkwo" },
      },
      now,
    );
    expect(id).not.toBe(OLD_USER._id);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      _id: OLD_USER._id,
      email: "ada@example.com",
      name: "Ada",
    });
    expect(rows[0]?.emailVerificationTime).toBeUndefined();
    expect(rows[1]?.email).toMatch(/^unverified\+/);
    expect(rows[1]?.emailVerificationTime).toBeUndefined();
    expect(rows[1]?.name).toBe("Ada Okonkwo");
  });

  it("sets emailVerificationTime only after the email OTP succeeds", async () => {
    const { ctx, rows } = fakeCtx([OLD_USER]);
    const now = 1_700_000_000_000;
    await createOrUpdateAuthUser(
      ctx,
      {
        existingUserId: OLD_USER._id,
        type: "verification",
        profile: { email: "ada@example.com", emailVerified: true },
      },
      now,
    );
    expect(rows[0]?.emailVerificationTime).toBe(now);
  });

  it("reclaims an older books row after verification and retires the temp user", async () => {
    const temp: AuthUserDoc = {
      _id: "users:temp" as AuthUserDoc["_id"],
      email: "ada@example.com",
      externalId: "ext-temp",
    };
    const { ctx, rows } = fakeCtx([OLD_USER, temp]);
    const now = 1_700_000_000_000;
    const id = await createOrUpdateAuthUser(
      ctx,
      {
        existingUserId: temp._id,
        type: "verification",
        profile: { email: "ada@example.com", emailVerified: true },
      },
      now,
    );
    expect(id).toBe(OLD_USER._id);
    expect(rows[0]?.emailVerificationTime).toBe(now);
    expect(rows[1]?.deletedAt).toBe(now);
    expect(rows[1]?.email).toMatch(/^reclaimed\+/);
  });

  it("upgrades a first-name-only fullName when signup sends first + last", async () => {
    const firstOnly: AuthUserDoc = {
      ...OLD_USER,
      name: "Audit",
      fullName: "Audit",
    };
    const { ctx, rows } = fakeCtx([firstOnly]);
    await createOrUpdateAuthUser(
      ctx,
      {
        existingUserId: firstOnly._id,
        type: "credentials",
        profile: {
          email: "ada@example.com",
          name: "Audit Test",
          emailVerified: true,
        },
      },
      1_700_000_000_000,
    );
    expect(rows[0]?.name).toBe("Audit Test");
    expect(rows[0]?.fullName).toBe("Audit Test");
  });

  it("inserts a new unverified user when the email is new", async () => {
    const { ctx, rows } = fakeCtx([]);
    const now = 1_700_000_000_000;
    const id = await createOrUpdateAuthUser(
      ctx,
      {
        existingUserId: null,
        type: "credentials",
        profile: { email: "new@example.com", name: "New User" },
      },
      now,
    );
    expect(id).toBeTruthy();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.emailVerificationTime).toBeUndefined();
    expect(rows[0]?.email).toBe("new@example.com");
  });
});
