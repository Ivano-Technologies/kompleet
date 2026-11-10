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
  looksLikeUbaTableStatement,
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
const ubaSurvivalText = readFileSync(
  join(fixtureDir, "uba-gtb-narration-survival.txt"),
  "utf-8",
);

const OPENING_BALANCE = 100000;
const EXPECTED_CLOSING_BALANCE = 125110200;
const POSTED_DATES = [
  "2024-01-02",
  "2024-01-03",
  "2024-01-04",
  "2024-01-05",
  "2024-01-06",
  "2024-01-07",
  "2024-01-08",
  "2024-01-09",
  "2024-01-10",
  "2024-01-11",
  "2024-01-12",
  "2024-01-13",
  "2024-01-14",
];

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

  it("strips the newer GTB head-office footer as one contiguous block", () => {
    const bled =
      "POS/SAMPLE MART ABUJA Plot 635, Akin Adesola Street, Victoria Island, Lagos Tel: 0700-GTBANK (0700-482265) +234 1 448 0740 www.gtbank.com";
    const cleaned = stripMergedPageFooter(bled);
    expect(cleaned).toMatch(/POS\/SAMPLE MART ABUJA/i);
    expect(cleaned).not.toMatch(/Akin Adesola/i);
    expect(cleaned).not.toMatch(/0700-GTBANK/i);
    expect(cleaned).not.toMatch(/gtbank\.com/i);
  });

  it("strips the 2016-2021 computer-generated GTB footer as one block", () => {
    const bled =
      "POS/IKEJA CITY MALL This is a computer generated email. Please address all enquiries to Guaranty Trust Bank Plc Systems and Control Group 178, Awolowo Road, Ikoyi. P.O.Box 75455, Victoria Island, Lagos, Nigeria. Phone 01-2694276 | Fax 01-2694276 or the Customer Information Unit of your local branch.";
    const cleaned = stripMergedPageFooter(bled);
    expect(cleaned).toMatch(/POS\/IKEJA CITY MALL/i);
    expect(cleaned).not.toMatch(/computer generated/i);
    expect(cleaned).not.toMatch(/Awolowo/i);
    expect(cleaned).not.toMatch(/2694276/);
    expect(cleaned).not.toMatch(/local branch/i);
  });

  it("does not eat real narrations that only share footer words", () => {
    expect(
      stripMergedPageFooter("NIP TRF TO GUARANTY TRUST BANK PLC/JOHN DOE"),
    ).toMatch(/GUARANTY TRUST BANK PLC\/JOHN DOE/i);
    expect(
      stripMergedPageFooter("POS PURCHASE SHOPRITE VICTORIA ISLAND, LAGOS"),
    ).toMatch(/SHOPRITE VICTORIA ISLAND, LAGOS/i);
    expect(stripMergedPageFooter("CHQ DEPOSIT 14481234 BRANCH")).toMatch(
      /14481234/,
    );
    expect(stripMergedPageFooter("MTN TEL: AIRTIME")).toMatch(/TEL:/i);
    expect(stripMergedPageFooter("TRANSFER TO BRANCH Akin Adesola")).toMatch(
      /Akin Adesola/i,
    );
  });
});

describe("GTB cleanup is gated off other banks", () => {
  it("does not treat a UBA statement with GTB in a narration as GTB", () => {
    expect(looksLikeUbaTableStatement(ubaSurvivalText)).toBe(true);
    expect(looksLikeGtbTableStatement(ubaSurvivalText)).toBe(false);
  });

  it("does not treat another bank's GTB counterparty as a GTB statement", () => {
    const accessLike = [
      "ACCESS BANK PLC",
      "Account Statement",
      "TRANS DATE VALUE DATE NARRATION DEBIT CREDIT BALANCE",
      "10-Mar-2024 10-Mar-2024 NIP TRF TO GUARANTY TRUST BANK PLC/JOHN DOE 5,000.00 5,000.00",
      "11-Mar-2024 11-Mar-2024 POS PURCHASE SHOPRITE VICTORIA ISLAND, LAGOS 2,000.00 3,000.00",
    ].join("\n");
    expect(looksLikeGtbTableStatement(accessLike)).toBe(false);
    const rows = extractStructuredStatementTransactions(accessLike);
    expect(rows[0]?.merchant).toMatch(/GUARANTY TRUST BANK PLC\/JOHN DOE/i);
    expect(rows[1]?.merchant).toMatch(/SHOPRITE VICTORIA ISLAND, LAGOS/i);
  });

  it("keeps UBA narrations that look like GTB footer fragments", () => {
    const transactions =
      extractStructuredStatementTransactions(ubaSurvivalText);
    expect(transactions.length).toBeGreaterThanOrEqual(5);

    const toGtb = transactions.find((row) => /JOHN DOE/i.test(row.merchant));
    expect(toGtb?.merchant).toMatch(/GUARANTY TRUST BANK PLC\/JOHN DOE/i);

    const shoprite = transactions.find((row) => /SHOPRITE/i.test(row.merchant));
    expect(shoprite?.merchant).toMatch(/VICTORIA ISLAND/i);

    const wrapped = transactions.find(
      (row) =>
        /SHOPRITE/i.test(row.merchant) && row.date === "2024-03-14",
    );
    expect(wrapped?.merchant).toMatch(/VICTORIA ISLAND LAGOS/i);

    const cheque = transactions.find((row) => /CHQ DEPOSIT/i.test(row.merchant));
    expect(cheque?.merchant).toMatch(/14481234/);
    expect(cheque?.merchant).toMatch(/BRANCH/i);

    const airtime = transactions.find((row) => /MTN/i.test(row.merchant));
    expect(airtime?.merchant).toMatch(/TEL:/i);
    expect(airtime?.merchant).toMatch(/AIRTIME/i);

    const acme = transactions.find((row) => /ACME/i.test(row.merchant));
    expect(acme?.merchant).toMatch(/ABC12345678901/);
    expect(acme?.reference).toBeUndefined();
  });
});

describe("GTB synthetic statement text", () => {
  it("recognizes the GTB table layout", () => {
    expect(looksLikeGtbTableStatement(syntheticText)).toBe(true);
  });

  it("extracts posted rows without quote-zero fragments or footer bleed", () => {
    const transactions = extractStructuredStatementTransactions(syntheticText);
    expect(transactions).toHaveLength(13);

    for (const row of transactions) {
      expect(row.merchant).not.toMatch(/'0/);
      expect(row.merchant).not.toMatch(/Plot 635/i);
      expect(row.merchant).not.toMatch(/0700-GTBANK/i);
      expect(row.merchant).not.toMatch(/gtbank\.com/i);
      expect(row.merchant).not.toMatch(/computer generated/i);
      expect(row.merchant).not.toMatch(/Awolowo/i);
      expect(row.merchant).not.toMatch(/2694276/);
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

    expect(transactions[2]).toMatchObject({
      date: "2024-01-04",
      amount: 2000,
      type: "debit",
      balance: 114500,
    });
    expect(transactions[2]?.merchant).toMatch(/SAMPLE MART ABUJA/i);

    expect(transactions[7]).toMatchObject({
      date: "2024-01-09",
      amount: 150000000,
      type: "credit",
      balance: 150119400,
    });

    expect(transactions[8]).toMatchObject({
      date: "2024-01-10",
      amount: 25000000,
      type: "debit",
      balance: 125119400,
    });
    expect(transactions[8]?.merchant).toMatch(
      /GUARANTY TRUST BANK PLC\/FUNKE ADEYEMI/i,
    );

    expect(transactions[9]?.merchant).toMatch(/SHOPRITE VICTORIA ISLAND, LAGOS/i);
    expect(transactions[10]?.merchant).toMatch(/14481234/);
    expect(transactions[11]?.merchant).toMatch(/TEL:/i);
    expect(transactions[12]).toMatchObject({
      date: "2024-01-14",
      amount: 5000,
      type: "debit",
      balance: 125110200,
    });
    expect(transactions[12]?.merchant).toMatch(/IKEJA CITY MALL/i);

    expect(transactions[6]).toMatchObject({
      date: "2024-01-08",
      amount: 50,
      type: "debit",
      balance: 119400,
    });
  });

  it("does not treat debit/credit/balance columns as interchangeable", () => {
    const transactions = extractStructuredStatementTransactions(syntheticText);
    const amounts = transactions.map((row) => row.amount);
    const balances = transactions.map((row) => row.balance);

    expect(amounts).toContain(150000000);
    expect(amounts).toContain(25000000);
    expect(amounts).not.toContain(150119400);
    expect(amounts).not.toContain(125119400);
    expect(amounts).not.toContain(125110200);
    expect(balances[balances.length - 1]).toBeCloseTo(
      EXPECTED_CLOSING_BALANCE,
      2,
    );
  });

  it("reconciles running balance across three pages including a mid-page footer", () => {
    const transactions = extractStructuredStatementTransactions(syntheticText);
    expect(transactions[2]?.date).toBe("2024-01-04");
    expect(transactions[3]?.date).toBe("2024-01-05");
    expect(transactions[7]?.date).toBe("2024-01-09");
    expect(transactions[8]?.date).toBe("2024-01-10");
    expect(transactions[9]?.date).toBe("2024-01-11");
    assertRunningBalanceReconciles(transactions, OPENING_BALANCE);
  });

  it("does not persist opening-balance as a transaction", () => {
    const transactions = extractStructuredStatementTransactions(syntheticText);
    expect(
      transactions.some((row) => /opening balance/i.test(row.merchant)),
    ).toBe(false);
  });

  it("unswaps a first posted row when there is no opening balance", () => {
    const snippet = [
      "GUARANTY TRUST BANK PLC",
      "TRANS DATE VALUE DATE REMARKS DEBIT CREDIT BALANCE",
      "02-Jan-2024 02-Jan-2024 NIP CR/FROM ADAEZE OKONKWO 95,000.00 5,000.00",
    ].join("\n");
    const transactions = extractStructuredStatementTransactions(snippet);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      amount: 5000,
      balance: 95000,
    });
  });
});

describe("GTB synthetic PDF parse", () => {
  it("parsePDF returns the posted rows without calling OpenAI", async () => {
    const result = await parsePDF(syntheticPdf, "GTBank");
    expect(result.successfulRows).toBe(13);
    expect(result.transactions).toHaveLength(13);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions.map((row) => row.date)).toEqual(POSTED_DATES);
    assertRunningBalanceReconciles(result.transactions, OPENING_BALANCE);
  });

  it("parseBankStatement(GTB, pdf) + normalize is persist-valid", async () => {
    const parsed = await parseBankStatement(syntheticPdf, "GTB", "pdf");
    expect(parsed.transactions).toHaveLength(13);

    const normalized = normalizeTransactions(parsed.transactions, "GTB");
    expect(normalized).toHaveLength(13);

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
    expect(text).toMatch(/Guaranty Trust|GTBank|NIP CR\/FROM ADAEZE|ADAEZE OKONKWO/i);
    const transactions = extractStructuredStatementTransactions(text);
    expect(transactions.length).toBeGreaterThan(0);
  });

  it("VERCEL/pdfjs path parses the committed GTB fixture to 13 rows", async () => {
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const extracted = await extractPdfText(syntheticPdf);
      const parsed = await parsePDF(syntheticPdf, "GTBank");
      expect(
        extracted.source === "pdfjs" || extracted.source === "pdf-parse",
        `source=${extracted.source}`,
      ).toBe(true);
      expect(parsed.transactions).toHaveLength(13);
      expect(parsed.errors).toHaveLength(0);
    } finally {
      if (previous === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previous;
    }
  });
});
