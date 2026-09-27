/**
 * IVA-81: real UBA PDFsharp statements wrap DD-Mon-YYYY across lines and
 * split narrations. Import must succeed without an LLM.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBankStatement } from "@/lib/transaction-import/bank-adapter";
import { parsePDF } from "@/lib/transaction-import/pdf-parser";
import {
  extractPdfText,
  extractPdfTextFromStreams,
} from "@/lib/transaction-import/pdf-text-extract";
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

  it("repairs pdfjs-interleaved 10-Mar- / year-later lines", () => {
    const interleaved = [
      "01-Jan-2024 01-Jan-2024 Opening Balance 1,017.00",
      "MOB/UTU/SAMPLE",
      "10-Mar- 10-Mar- PAYER/Check/22024311590",
      "1,000.00 2,017.00",
      "2024 2024 MOB/UTU/From",
      "SAMPLE PAYER",
      "22-Mar- 22-Mar-",
      "-stamp duty charges 50.00 1,967.00",
      "2024 2024",
    ].join("\n");
    const repaired = repairWrappedStatementDates(interleaved);
    expect(repaired).toContain("10-Mar-2024");
    expect(repaired).toContain("22-Mar-2024");
    const transactions = extractStructuredStatementTransactions(repaired);
    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      date: "2024-03-10",
      amount: 1000,
      type: "credit",
    });
    expect(transactions[1]).toMatchObject({
      date: "2024-03-22",
      amount: 50,
      type: "debit",
    });
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

  it("FlateDecode stream extract (no canvas) yields statement text", () => {
    const text = extractPdfTextFromStreams(wrappedPdf);
    expect(text.length).toBeGreaterThan(50);
    const transactions = extractStructuredStatementTransactions(text);
    expect(transactions.length).toBeGreaterThan(0);
  });

  it("VERCEL/pdfjs path parses the committed wrapped fixture to 8 rows", async () => {
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const extracted = await extractPdfText(wrappedPdf);
      const parsed = await parsePDF(wrappedPdf, "UBA");
      expect(
        extracted.source === "pdfjs" || extracted.source === "pdf-parse",
        `source=${extracted.source}`,
      ).toBe(true);
      expect(parsed.transactions).toHaveLength(8);
      expect(parsed.errors).toHaveLength(0);
    } finally {
      if (previous === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previous;
    }
  });
});

describe("CoS Preview PDFs (not committed)", () => {
  const cosUba = [
    "/home/ubuntu/.cursor/projects/workspace/uploads/UBA-BAYEK-2024_14cc.pdf",
    "/home/ubuntu/.cursor/projects/workspace/uploads/UBA-BAYEK-2024_fa64.pdf",
    "/workspace/kompleet-import-uba/UBA-BAYEK-2024.pdf",
  ].find((path) => existsSync(path));
  const cosBad = [
    "/home/ubuntu/.cursor/projects/workspace/uploads/bad-layout_f893.pdf",
  ].find((path) => existsSync(path));

  it.skipIf(!cosUba)("real UBA-BAYEK-2024.pdf streams + parsePDF to 8 rows", async () => {
    const buf = readFileSync(cosUba!);
    const streamed = extractStructuredStatementTransactions(
      extractPdfTextFromStreams(buf),
    );
    const parsed = await parsePDF(buf, "UBA");
    expect(parsed.transactions).toHaveLength(8);
    expect(parsed.errors).toHaveLength(0);
    if (streamed.length > 0) {
      expect(streamed.length).toBeGreaterThanOrEqual(8);
    }
  });

  it.skipIf(!cosUba)("VERCEL path still yields 8 rows (pdfjs worker, not streams)", async () => {
    const buf = readFileSync(cosUba!);
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const extracted = await extractPdfText(buf);
      const parsed = await parsePDF(buf, "UBA");
      const dates = extracted.text.match(/\d{1,2}-[A-Za-z]{3}-\d{2,4}/g) ?? [];
      const structured = extractStructuredStatementTransactions(
        repairWrappedStatementDates(extracted.text),
      );
      expect(
        structured.length,
        `source=${extracted.source} chars=${extracted.text.length} dates=${dates.length} structured=${structured.length} sample=${JSON.stringify(extracted.text.slice(0, 500))}`,
      ).toBe(8);
      expect(parsed.transactions).toHaveLength(8);
      expect(parsed.errors).toHaveLength(0);
    } finally {
      if (previous === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previous;
    }
  });

  it.skipIf(!cosBad)("bad-layout.pdf fails closed without hanging", async () => {
    const buf = readFileSync(cosBad!);
    const parsed = await parsePDF(buf, "UBA");
    expect(parsed.transactions).toHaveLength(0);
    expect(parsed.errors.length).toBeGreaterThan(0);
  });
});
