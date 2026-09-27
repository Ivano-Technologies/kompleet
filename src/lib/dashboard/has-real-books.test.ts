import { describe, expect, it } from "vitest";
import {
  computeHasRealBooks,
  isDemoBooksEnabled,
  isSeedOrFixtureSession,
  isSuccessfulImportSession,
} from "./has-real-books";

const realSession = {
  status: "completed",
  transactions_imported: 4,
  file_name: "GTB_September.csv",
};

describe("IVA-86 hasRealBooks", () => {
  it("is false for a fresh user with no imports or txns", () => {
    expect(
      computeHasRealBooks({ sessions: [], transactionCount: 0 }),
    ).toBe(false);
  });

  it("is false when txns exist without a successful import (manual / leftover)", () => {
    expect(
      computeHasRealBooks({ sessions: [], transactionCount: 3 }),
    ).toBe(false);
  });

  it("is false when an import completed with zero posted rows", () => {
    expect(
      computeHasRealBooks({
        sessions: [
          {
            status: "completed",
            transactions_imported: 0,
            file_name: "empty.csv",
          },
        ],
        transactionCount: 0,
      }),
    ).toBe(false);
  });

  it("is true after a successful import with ≥1 txn", () => {
    expect(
      computeHasRealBooks({
        sessions: [realSession],
        transactionCount: 4,
      }),
    ).toBe(true);
  });

  it("rejects seed/fixture/demo filenames even if status is completed", () => {
    expect(isSeedOrFixtureSession("seed-demo.csv")).toBe(true);
    expect(isSeedOrFixtureSession("bank-fixture.xlsx")).toBe(true);
    expect(isSuccessfulImportSession({
      status: "completed",
      transactions_imported: 12,
      file_name: "demo-data.csv",
    })).toBe(false);
    expect(
      computeHasRealBooks({
        sessions: [
          {
            status: "completed",
            transactions_imported: 12,
            file_name: "seed-statement.csv",
          },
        ],
        transactionCount: 12,
      }),
    ).toBe(false);
  });

  it("never treats demo mode as real books", () => {
    expect(
      computeHasRealBooks({
        sessions: [realSession],
        transactionCount: 4,
        demoMode: true,
      }),
    ).toBe(false);
  });

  it("keeps www/prod demo default OFF unless env + query flag are both set", () => {
    expect(isDemoBooksEnabled({})).toBe(false);
    expect(isDemoBooksEnabled({ searchParam: "1" })).toBe(false);
    expect(isDemoBooksEnabled({ envFlag: "1" })).toBe(false);
    expect(isDemoBooksEnabled({ searchParam: "1", envFlag: "1" })).toBe(true);
  });
});
