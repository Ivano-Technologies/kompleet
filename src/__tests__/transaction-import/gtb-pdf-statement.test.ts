/**
 * GTB (Guaranty Trust Bank) PDF statement parser.
 * Synthetic fixture only: fabricated names, amounts and references.
 */

import { readFileSync } from "node:fs";
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
  looksLikeGtbTableStatement,
  stripLeadingQuoteZeroFragments,
  stripMergedPageFooter,
} from "@/lib/transaction-import/statement-text-parser";
import {
  normalizeTransactions,
  validateNormalizedTransaction,
} from "@/lib/transaction-import/normalizer";

const fixtureDir = join(process.cwd(), "tests/fixtures/banks");
const syntheticText = readFileSync(
  join(fixtureDir, "gtb-statement-synthetic.txt"),
  "utf-8",
);
const syntheticPdf = readFileSync(
  join(fixtureDir, "gtb-statement-synthetic.pdf"),
);

const OPENING_BALANCE = 100000;
const EXPECTED_CLOSING_BALANCE = 119400;

function assertRunningBalanceReconciles(
  transactions: { amount: number; type: "debit" | "credit"; balance: number }[],
  openingBalance: number,
): void {
  let running = openingBalance;
  for (const row of transactions) {
    running =
      row.type === "credit"
        ? running + row.amount
        : running - row.amount;
    expect(row.balance).toBeCloseTo(running, 2);
  }
  expect(running).toBeCloseTo(EXPECTED_CLOSING_BALANCE, 2);
}

describe("GTB field sanitizers", () => {
  it("strips leading '0 and '00 fragments from parsed fields", () => {
    expect(stripLeadingQuoteZeroFragments("'0 NIP CR/FROM ADAEZE OKONKWO")).toBe(
      "NIP CR/FROM ADAEZE OKONKWO",
    );
    expect(
      stripLeadingQuoteZeroFragments("'00 NIP DR/TO CHINEDU BALA SUPPLIES"),
    ).toBe("NIP DR/TO CHINEDU BALA SUPPLIES");
    expect(stripLeadingQuoteZeroFragments("'00TRANSFER TO UTILITY")).toBe(
      "TRANSFER TO UTILITY",
    );
    expect(stripLeadingQuoteZeroFragments("POS/SAMPLE MART ABUJA")).toBe(
      "POS/SAMPLE MART ABUJA",
    );
    expect(stripLeadingQuoteZeroFragments("'012345678901")).toBe(
      "'012345678901",
    );
  });

  it("strips merged GTB page-footer address and phone lines", () => {
    const bled =
      "POS/SAMPLE MART ABUJA Plot 635, Akin Adesola Street, Victoria Island, Lagos Tel: 0700-GTBANK (0700-482265) +234 1 448 0740 www.gtbank.com";
    const cleaned = stripMergedPageFooter(bled);
    expect(cleaned).toMatch(/POS\/SAMPLE MART ABUJA/i);
    expect(cleaned).not.toMatch(/Akin Adesola/i);
    expect(cleaned).not.toMatch(/Victoria Island/i);
    expect(cleaned).not.toMatch(/0700-GTBANK/i);
    expect(cleaned).not.toMatch(/448 0740/i);
    expect(cleaned).not.toMatch(/gtbank\.com/i);
  });
});

describe("GTB synthetic statement text", () => {
  it("recognizes the GTB table layout", () => {
    expect(looksLikeGtbTableStatement(syntheticText)).toBe(true);
  });

  it("extracts posted rows without quote-zero fragments or footer bleed", () => {
    const transactions = extractStructuredStatementTransactions(syntheticText);
    expect(transactions).toHaveLength(7);

    for (const row of transactions) {
      expect(row.merchant).not.toMatch(/'0/);
      expect(row.merchant).not.toMatch(/Akin Adesola/i);
      expect(row.merchant).not.toMatch(/Victoria Island/i);
      expect(row.merchant).not.toMatch(/0700-GTBANK/i);
      expect(row.merchant).not.toMatch(/gtbank\.com/i);
      expect(row.merchant).not.toMatch(/448 0740/);
      if (row.reference) {
        expect(row.reference).not.toMatch(/^'0/);
      }
    }

    expect(transactions[0]).toMatchObject({
      date: "2024-01-02",
      amount: 25000,
      type: "credit",
      balance: 125000,
    });
    expect(transactions[0]?.merchant).toMatch(/ADAEZE OKONKWO/i);

    expect(transactions[1]).toMatchObject({
      date: "2024-01-03",
      amount: 8500,
      type: "debit",
      balance: 116500,
    });
    expect(transactions[1]?.merchant).toMatch(/CHINEDU BALA/i);

    expect(transactions[2]).toMatchObject({
      date: "2024-01-04",
      amount: 2000,
      type: "debit",
      balance: 114500,
    });
    expect(transactions[2]?.merchant).toMatch(/SAMPLE MART ABUJA/i);

    expect(transactions[3]).toMatchObject({
      date: "2024-01-05",
      amount: 15000,
      type: "credit",
      balance: 129500,
    });

    expect(transactions[6]).toMatchObject({
      date: "2024-01-08",
      amount: 50,
      type: "debit",
      balance: 119400,
    });
    expect(transactions[6]?.merchant).toMatch(/SMS CHARGE/i);
  });

  it("does not treat debit/credit/balance columns as interchangeable", () => {
    const transactions = extractStructuredStatementTransactions(syntheticText);
    const amounts = transactions.map((row) => row.amount);
    const balances = transactions.map((row) => row.balance);

    expect(amounts).not.toContain(125000);
    expect(amounts).not.toContain(116500);
    expect(amounts).not.toContain(114500);
    expect(amounts).not.toContain(129500);
    expect(amounts).not.toContain(129450);
    expect(amounts).not.toContain(119450);
    expect(amounts).not.toContain(119400);
    expect(balances[balances.length - 1]).toBeCloseTo(
      EXPECTED_CLOSING_BALANCE,
      2,
    );
  });

  it("reconciles running balance across both pages", () => {
    const transactions = extractStructuredStatementTransactions(syntheticText);
    expect(transactions[2]?.date).toBe("2024-01-04");
    expect(transactions[3]?.date).toBe("2024-01-05");
    expect(transactions[2]?.balance).toBeCloseTo(114500, 2);
    expect(transactions[3]?.balance).toBeCloseTo(129500, 2);
    assertRunningBalanceReconciles(transactions, OPENING_BALANCE);
  });

  it("does not persist opening-balance as a transaction", () => {
    const transactions = extractStructuredStatementTransactions(syntheticText);
    expect(
      transactions.some((row) => /opening balance/i.test(row.merchant)),
    ).toBe(false);
  });
});

describe("GTB synthetic PDF parse", () => {
  it("parsePDF returns the seven posted rows without calling OpenAI", async () => {
    const result = await parsePDF(syntheticPdf, "GTBank");
    expect(result.successfulRows).toBe(7);
    expect(result.transactions).toHaveLength(7);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions.map((row) => row.date)).toEqual([
      "2024-01-02",
      "2024-01-03",
      "2024-01-04",
      "2024-01-05",
      "2024-01-06",
      "2024-01-07",
      "2024-01-08",
    ]);
    assertRunningBalanceReconciles(result.transactions, OPENING_BALANCE);
  });

  it("parseBankStatement(GTB, pdf) + normalize is persist-valid", async () => {
    const parsed = await parseBankStatement(syntheticPdf, "GTB", "pdf");
    expect(parsed.transactions).toHaveLength(7);

    const normalized = normalizeTransactions(parsed.transactions, "GTB");
    expect(normalized).toHaveLength(7);

    for (const row of normalized) {
      const check = validateNormalizedTransaction(row);
      expect(check.valid, check.errors.join("; ")).toBe(true);
      expect(row.amount).toBeGreaterThan(0);
    }

    assertRunningBalanceReconciles(normalized, OPENING_BALANCE);
  });

  it("FlateDecode stream extract (no canvas) yields GTB statement text", () => {
    const text = extractPdfTextFromStreams(syntheticPdf);
    expect(text.length).toBeGreaterThan(50);
    expect(text).toMatch(/Guaranty Trust|GTBank|NIP CR\/FROM ADAEZE/i);
    const transactions = extractStructuredStatementTransactions(text);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions.some((row) => /ADAEZE OKONKWO/i.test(row.merchant))).toBe(
      true,
    );
  });

  it("VERCEL/pdfjs path parses the committed GTB fixture to 7 rows", async () => {
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const extracted = await extractPdfText(syntheticPdf);
      const parsed = await parsePDF(syntheticPdf, "GTBank");
      expect(
        extracted.source === "pdfjs" || extracted.source === "pdf-parse",
        `source=${extracted.source}`,
      ).toBe(true);
      expect(parsed.transactions).toHaveLength(7);
      expect(parsed.errors).toHaveLength(0);
    } finally {
      if (previous === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previous;
    }
  });
});
