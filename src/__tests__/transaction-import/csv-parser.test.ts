/**
 * CSV parser: exact bank fixtures plus real-world variants that used to
 * yield zero rows (BOM, preamble, header aliases, generic columns).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCSV } from "@/lib/transaction-import/csv-parser";
import {
  getBankConfig,
  resolveBankCode,
} from "@/lib/transaction-import/bank-configs";
import {
  isValidBankCode,
  parseBankStatement,
} from "@/lib/transaction-import/bank-adapter";

const GTB = getBankConfig("GTB")!;
const GENERIC = getBankConfig("GENERIC")!;

const gtbFixture = readFileSync(
  join(process.cwd(), "e2e/fixtures/gtbank-statement.csv"),
  "utf-8",
);
const gtbSample = readFileSync(
  join(process.cwd(), "tests/fixtures/banks/gtbank_sample1.csv"),
  "utf-8",
);
const moniepointSample = readFileSync(
  join(process.cwd(), "tests/fixtures/banks/moniepoint_sample1.csv"),
  "utf-8",
);

describe("resolveBankCode / isValidBankCode", () => {
  it("accepts canonical codes and common aliases", () => {
    expect(resolveBankCode("GTB")).toBe("GTB");
    expect(resolveBankCode("gtbank")).toBe("GTB");
    expect(resolveBankCode("auto")).toBe("AUTO");
    expect(resolveBankCode("generic")).toBe("GENERIC");
    expect(isValidBankCode("zenith")).toBe(true);
    expect(isValidBankCode("XXX")).toBe(false);
  });
});

describe("parseCSV", () => {
  it("parses the e2e GTBank fixture (5 rows)", async () => {
    const result = await parseCSV(gtbFixture, GTB);
    expect(result.successfulRows).toBe(5);
    expect(result.transactions).toHaveLength(5);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions[0]).toMatchObject({
      date: "2025-03-03",
      merchant: "Kompleet Fixture Consulting Income",
      amount: 450000,
      type: "credit",
    });
  });

  it("parses the checked-in GTBank sample", async () => {
    const result = await parseCSV(gtbSample, GTB);
    expect(result.successfulRows).toBe(10);
    expect(result.errors).toHaveLength(0);
  });

  it("parses Moniepoint sample with MON config", async () => {
    const result = await parseCSV(moniepointSample, getBankConfig("MON")!);
    expect(result.successfulRows).toBe(10);
    expect(result.transactions[0]?.reference).toBe("MPT20260115001");
  });

  it("strips a UTF-8 BOM so Date is still found", async () => {
    const bom = `\uFEFF${gtbFixture}`;
    const result = await parseCSV(bom, GTB);
    expect(result.successfulRows).toBe(5);
  });

  it("skips account-info preamble rows before the header", async () => {
    const withPreamble = [
      "GTBank Statement",
      "Account Name: Test User",
      "Account Number: 0123456789",
      "",
      gtbFixture,
    ].join("\n");
    const result = await parseCSV(withPreamble, GTB);
    expect(result.successfulRows).toBe(5);
  });

  it("accepts Narration instead of Transaction Details (real GTB export)", async () => {
    const csv = [
      "Date,Narration,Debit,Credit,Balance",
      "15/01/2026,POS - Shoprite,25000.00,,325000.00",
      "16/01/2026,Salary Credit,,500000.00,825000.00",
    ].join("\n");
    const result = await parseCSV(csv, GTB);
    expect(result.successfulRows).toBe(2);
    expect(result.transactions[0]?.merchant).toBe("POS - Shoprite");
    expect(result.transactions[0]?.type).toBe("debit");
    expect(result.transactions[1]?.type).toBe("credit");
  });

  it("parses semicolon-delimited statements", async () => {
    const csv = [
      "Date;Transaction Details;Debit;Credit;Balance",
      "03/03/2025;Office Rent;120000.00;;880000.00",
    ].join("\n");
    const result = await parseCSV(csv, GTB);
    expect(result.successfulRows).toBe(1);
    expect(result.transactions[0]?.amount).toBe(120000);
  });

  it("parses a generic Date,Description,Amount CSV via GENERIC config", async () => {
    const csv = [
      "Date,Description,Amount",
      "2026-01-15,Client invoice,150000",
      "2026-01-16,Fuel,-8500",
    ].join("\n");
    const result = await parseCSV(csv, GENERIC);
    expect(result.successfulRows).toBe(2);
    expect(result.transactions[0]?.type).toBe("credit");
    expect(result.transactions[1]?.type).toBe("debit");
    expect(result.transactions[1]?.amount).toBe(8500);
  });

  it("still produces rows when GTB is selected but headers are generic", async () => {
    const csv = [
      "Date,Description,Amount",
      "15/01/2026,Shoprite POS,25000",
    ].join("\n");
    const result = await parseCSV(csv, GTB);
    expect(result.successfulRows).toBe(1);
    expect(result.transactions[0]?.merchant).toBe("Shoprite POS");
  });
});

describe("parseBankStatement CSV", () => {
  it("imports the e2e fixture through the adapter", async () => {
    const result = await parseBankStatement(gtbFixture, "GTB", "csv");
    expect(result.transactions).toHaveLength(5);
    expect(result.errors).toHaveLength(0);
  });

  it("AUTO-detects the GTBank sample", async () => {
    const result = await parseBankStatement(gtbSample, "AUTO", "csv");
    expect(result.transactions.length).toBeGreaterThan(0);
  });

  it("accepts the legacy gtbank alias", async () => {
    const result = await parseBankStatement(gtbFixture, "gtbank", "csv");
    expect(result.transactions).toHaveLength(5);
  });
});
