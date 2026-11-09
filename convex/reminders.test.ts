/** @vitest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { MutationCtx } from "./_generated/server";
import { claimSendHandler } from "./reminders";

function fakeDb() {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    deadlineReminders: [],
  };
  let nextId = 1;
  const queryTable = (table: string) => ({
    withIndex: (
      _name: string,
      build?: (q: {
        eq: (field: string, value: unknown) => unknown;
      }) => unknown,
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
        collect: async () => match(),
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
        tables[table].push({ _id, ...doc });
        return _id;
      },
    },
  };
}

function asCtx(db: ReturnType<typeof fakeDb>): MutationCtx {
  return db as unknown as MutationCtx;
}

const CLAIM = {
  userId: "users:1" as never,
  formType: "PIT",
  taxYear: 2026,
  daysRemaining: 7,
  deadlineDate: "2027-03-31",
  now: Date.parse("2027-03-24T08:00:00.000Z"),
};

describe("claimSendHandler", () => {
  it("records the first send and rejects a duplicate", async () => {
    const db = fakeDb();
    await expect(claimSendHandler(asCtx(db), CLAIM)).resolves.toBe(true);
    await expect(claimSendHandler(asCtx(db), CLAIM)).resolves.toBe(false);
    expect(db.tables.deadlineReminders).toHaveLength(1);
  });

  it("allows the same deadline at a different window", async () => {
    const db = fakeDb();
    await expect(claimSendHandler(asCtx(db), CLAIM)).resolves.toBe(true);
    await expect(
      claimSendHandler(asCtx(db), { ...CLAIM, daysRemaining: 3 }),
    ).resolves.toBe(true);
    expect(db.tables.deadlineReminders).toHaveLength(2);
  });

  it("scopes occupancy per user", async () => {
    const db = fakeDb();
    await expect(claimSendHandler(asCtx(db), CLAIM)).resolves.toBe(true);
    await expect(
      claimSendHandler(asCtx(db), { ...CLAIM, userId: "users:2" as never }),
    ).resolves.toBe(true);
  });
});

describe("deadline reminder cron", () => {
  it("schedules a daily Convex cron for the send action", () => {
    const source = readFileSync(resolve("convex/crons.ts"), "utf8");
    expect(source).toMatch(/cronJobs/);
    expect(source).toMatch(/crons\.daily/);
    expect(source).toMatch(/internal\.reminders\.sendDueReminders/);
  });
});
