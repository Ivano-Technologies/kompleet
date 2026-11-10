/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  deviceFingerprint,
  recordDeviceHandler,
  summarizeUserAgent,
} from "./authDevices";
import type { MutationCtx } from "../_generated/server";

function fakeCtx() {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    authDevices: [],
  };
  let nextId = 1;
  const queryTable = (table: string) => ({
    withIndex: (
      _name: string,
      build?: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
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
        tables[table]!.push({ _id, ...doc });
        return _id;
      },
      patch: async (id: string, patch: Record<string, unknown>) => {
        for (const rows of Object.values(tables)) {
          const row = rows.find((item) => item._id === id);
          if (row) Object.assign(row, patch);
        }
      },
      delete: async (id: string) => {
        for (const table of Object.keys(tables)) {
          tables[table] = tables[table]!.filter((row) => row._id !== id);
        }
      },
    },
  };
}

describe("authDevices", () => {
  it("hashes user agents so the raw string is not the key", async () => {
    const hash = await deviceFingerprint("Mozilla/5.0 Chrome");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("chrome");
    expect(await deviceFingerprint("Mozilla/5.0 Chrome")).toBe(hash);
    expect(await deviceFingerprint("Mozilla/5.0 Firefox")).not.toBe(hash);
  });

  it("does not notify on the first device", async () => {
    const db = fakeCtx();
    const result = await recordDeviceHandler(
      db as unknown as MutationCtx,
      { _id: "users:1" as never },
      { userAgent: "Chrome", now: 1 },
    );
    expect(result).toEqual({ isNewDevice: true, notify: false });
    expect(db.tables.authDevices).toHaveLength(1);
  });

  it("notifies when a second fingerprint appears", async () => {
    const db = fakeCtx();
    const user = { _id: "users:1" as never };
    await recordDeviceHandler(db as unknown as MutationCtx, user, {
      userAgent: "Chrome",
      now: 1,
    });
    const second = await recordDeviceHandler(db as unknown as MutationCtx, user, {
      userAgent: "Firefox",
      now: 2,
    });
    expect(second).toEqual({ isNewDevice: true, notify: true });
    const repeat = await recordDeviceHandler(db as unknown as MutationCtx, user, {
      userAgent: "Chrome",
      now: 3,
    });
    expect(repeat).toEqual({ isNewDevice: false, notify: false });
  });

  it("summarises an empty user agent", () => {
    expect(summarizeUserAgent("")).toBe("Unknown device");
  });
});
