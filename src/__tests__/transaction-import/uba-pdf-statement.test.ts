/**
 * IVA-81: real UBA PDFsharp statements wrap DD-Mon-YYYY across lines and
 * split narrations. Import must succeed without an LLM.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBankStatement } from "@/lib/transaction-import/bank-adapter";
import { parsePDF } from "@/lib/transaction-import/pdf-parser";
import {
  extractStructuredStatementTransactions,
  looksLikeUbaTableStatement,
  repairWrappedStatementDates,
} from "@/lib/transaction-import/statement-text-parser";
import {
  normalizeTransactions,
  validateNormalizedTransaction,
} from "@/lib/transaction-import/normalizer";

const fixtureDir = join(process.cwd(), "tests/fixtures/banks");
const wrappedText = readFileSync(
  join(fixtureDir, "uba-statement-wrapped.txt"),
  "utf-8",
);
const wrappedPdf = readFileSync(join(fixtureDir, "uba-statement-wrapped.pdf"));

describe("UBA wrapped-date statement text (IVA-81)", () => {
  it("repairs 10-Mar- / 2024 wraps into a single date token", () => {
    const repaired = repairWrappedStatementDates(wrappedText);
    expect(repaired).toContain("10-Mar-2024");
    expect(repaired).toContain("22-Mar-2024");
    expect(repaired).toContain("18-Dec-2024");
    expect(repaired).toContain("22-Dec-2024");
    expect(repaired).not.toMatch(/10-Mar-\s*\n\s*2024/);
  });

  it("recognizes the UBA table header layout", () => {
    expect(looksLikeUbaTableStatement(wrappedText)).toBe(true);
  });

  it("extracts all eight posted rows with debit/credit from running balance", () => {
    const transactions = extractStructuredStatementTransactions(wrappedText);
    expect(transactions).toHaveLength(8);

    expect(transactions[0]).toMatchObject({
      date: "2024-03-10",
      amount: 1000,
      type: "credit",
      balance: 2017,
    });
    expect(transactions[0]?.merchant).toMatch(/MOB\/UTU/i);
    expect(transactions[0]?.merchant).not.toMatch(/1026\d{6}/);

    expect(transactions[1]).toMatchObject({
      date: "2024-03-22",
      amount: 50,
      type: "debit",
      balance: 1967,
    });
    expect(transactions[1]?.merchant).toMatch(/stamp duty/i);

    expect(transactions[2]).toMatchObject({
      date: "2024-06-17",
      amount: 4,
      type: "debit",
      balance: 1963,
    });
    expect(transactions[2]?.reference).toBe("270324000000000000000001");

    expect(transactions[3]).toMatchObject({
      date: "2024-07-05",
      amount: 4,
      type: "debit",
      balance: 1959,
    });

    expect(transactions[4]).toMatchObject({
      date: "2024-07-19",
      amount: 2000,
      type: "credit",
      balance: 3959,
    });

    expect(transactions[5]).toMatchObject({
      date: "2024-07-19",
      amount: 5000,
      type: "credit",
      balance: 8959,
    });

    expect(transactions[6]).toMatchObject({
      date: "2024-12-18",
      amount: 2099.21,
      type: "credit",
      balance: 11058.21,
    });
    expect(transactions[6]?.merchant).toMatch(/Cr to Xfer Ac/i);

    expect(transactions[7]).toMatchObject({
      date: "2024-12-22",
      amount: 5,
      type: "debit",
      balance: 11053.21,
    });

    const debitTotal = transactions
      .filter((row) => row.type === "debit")
      .reduce((sum, row) => sum + row.amount, 0);
    const creditTotal = transactions
      .filter((row) => row.type === "credit")
      .reduce((sum, row) => sum + row.amount, 0);
    expect(debitTotal).toBeCloseTo(63, 2);
    expect(creditTotal).toBeCloseTo(10099.21, 2);
  });

  it("does not persist opening-balance as a transaction", () => {
    const transactions = extractStructuredStatementTransactions(wrappedText);
    expect(
      transactions.some((row) => /opening balance/i.test(row.merchant)),
    ).toBe(false);
  });
});

describe("UBA PDF parse + persist-ready normalize (IVA-81)", () => {
  it("parsePDF returns the eight rows without calling OpenAI", async () => {
    const result = await parsePDF(wrappedPdf, "UBA");
    expect(result.successfulRows).toBe(8);
    expect(result.transactions).toHaveLength(8);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions.map((row) => row.date)).toEqual([
      "2024-03-10",
      "2024-03-22",
      "2024-06-17",
      "2024-07-05",
      "2024-07-19",
      "2024-07-19",
      "2024-12-18",
      "2024-12-22",
    ]);
  });

  it("parseBankStatement(UBA, pdf) + normalize is persist-valid", async () => {
    const parsed = await parseBankStatement(wrappedPdf, "UBA", "pdf");
    expect(parsed.transactions).toHaveLength(8);

    const normalized = normalizeTransactions(parsed.transactions, "UBA");
    expect(normalized).toHaveLength(8);

    for (const row of normalized) {
      const check = validateNormalizedTransaction(row);
      expect(check.valid, check.errors.join("; ")).toBe(true);
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.amount).toBeGreaterThan(0);
      expect(row.type === "debit" || row.type === "credit").toBe(true);
    }

    const persistItems = normalized.map((row) => ({
      transactionDate: row.date,
      description: row.merchant,
      amount: row.amount,
      transactionType: row.type,
      balance: row.balance,
      reference: row.reference,
      source: "UBA_import",
    }));
    expect(persistItems[0]?.transactionDate).toBe("2024-03-10");
    expect(persistItems[persistItems.length - 1]?.balance).toBeCloseTo(
      11053.21,
      2,
    );
  });

  it("AUTO bank code still parses the UBA PDF table", async () => {
    const parsed = await parseBankStatement(wrappedPdf, "AUTO", "pdf");
    expect(parsed.transactions).toHaveLength(8);
  });
});
