/** @vitest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MutationCtx } from "./_generated/server";
import {
  claimSendHandler,
  releaseSendHandler,
  sendReminderEmail,
} from "./reminders";

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
      delete: async (id: string) => {
        for (const rows of Object.values(tables)) {
          const idx = rows.findIndex((row) => row._id === id);
          if (idx >= 0) rows.splice(idx, 1);
        }
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

  it("drops a claimed row so a failed send can retry", async () => {
    const db = fakeDb();
    await expect(claimSendHandler(asCtx(db), CLAIM)).resolves.toBe(true);
    await releaseSendHandler(asCtx(db), {
      userId: CLAIM.userId,
      formType: CLAIM.formType,
      taxYear: CLAIM.taxYear,
      daysRemaining: CLAIM.daysRemaining,
    });
    expect(db.tables.deadlineReminders).toHaveLength(0);
    await expect(claimSendHandler(asCtx(db), CLAIM)).resolves.toBe(true);
  });
});

describe("sendReminderEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does not log the recipient or mark a send when the mail key is missing", async () => {
    vi.stubEnv("AUTH_RESEND_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      sendReminderEmail("hidden@example.com", {
        subject: "Due",
        html: "<p>Due</p>",
        text: "Due",
      }),
    ).resolves.toBe(false);
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).not.toMatch(/hidden@example.com/);
    expect(logged).not.toMatch(/@/);
  });
});

describe("deadline reminder cron", () => {
  it("schedules a daily Convex cron for the send action", () => {
    const source = readFileSync(resolve("convex/crons.ts"), "utf8");
    expect(source).toMatch(/cronJobs/);
    expect(source).toMatch(/crons\.daily/);
    expect(source).toMatch(/internal\.reminders\.sendDueReminders/);
    const send = readFileSync(resolve("convex/reminders.ts"), "utf8");
    expect(send).toMatch(/reminderAppliesToEntity/);
    expect(send).toMatch(/internal\.reminders\.releaseSend/);
  });
});
