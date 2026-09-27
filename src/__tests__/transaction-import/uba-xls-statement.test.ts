/**
 * UBA internet-banking Excel export (OpTransactionHistory*.xls).
 * Real OLE Compound Document, not HTML-as-xls and not PDF.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBankStatement } from "@/lib/transaction-import/bank-adapter";
import { detectBank } from "@/lib/transaction-import/bank-detector";
import { parseExcel } from "@/lib/transaction-import/excel-parser";
import { getBankConfig } from "@/lib/transaction-import/bank-configs";
import { parsePDF } from "@/lib/transaction-import/pdf-parser";
import {
  normalizeTransactions,
  validateNormalizedTransaction,
} from "@/lib/transaction-import/normalizer";

const fixturePath = join(
  process.cwd(),
  "tests/fixtures/banks/uba-op-transaction-history.xls",
);
const fixture = readFileSync(fixturePath);

const liveXls = [
  "/home/ubuntu/.cursor/projects/workspace/uploads/OpTransactionHistory_d73c.xls",
  "/home/ubuntu/.cursor/projects/workspace/uploads/OpTransactionHistory.xls",
].find((path) => existsSync(path));

const livePdf = [
  "/home/ubuntu/.cursor/projects/workspace/uploads/statement_400b.pdf",
  "/home/ubuntu/.cursor/projects/workspace/uploads/statement.pdf",
].find((path) => existsSync(path));

describe("UBA OpTransactionHistory.xls (OLE)", () => {
  it("maps excelConfig to the OpTransactionHistoryUX header/columns", () => {
    const uba = getBankConfig("UBA")!;
    expect(uba.excelConfig.headerRow).toBe(15);
    expect(uba.excelConfig.dateColumn).toBe("C");
    expect(uba.excelConfig.merchantColumn).toBe("G");
    expect(uba.excelConfig.debitColumn).toBe("I");
    expect(uba.excelConfig.creditColumn).toBe("K");
    expect(uba.excelConfig.balanceColumn).toBe("L");
    expect(uba.excelConfig.dateFormat).toBe("DD/MM/YYYY");
  });

  it("fixture is a real OLE Compound Document, not HTML or PDF", () => {
    expect(fixture.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))).toBe(
      true,
    );
    expect(fixture.subarray(0, 5).toString("latin1")).not.toBe("%PDF-");
    expect(fixture.subarray(0, 6).toString("latin1").toLowerCase()).not.toContain(
      "html",
    );
  });

  it("parses the committed OpTransactionHistory layout as UBA", async () => {
    const parsed = await parseBankStatement(
      fixture,
      "UBA",
      "excel",
      undefined,
      "OpTransactionHistoryUX5.xls",
    );

    expect(parsed.successfulRows).toBe(4);
    expect(parsed.transactions).toHaveLength(4);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.transactions[0]).toMatchObject({
      date: "2026-09-27",
      amount: 1000,
      type: "debit",
      balance: 5000,
    });
    expect(parsed.transactions[0]?.merchant).toMatch(/PROJECT EXPENSES/i);
    expect(parsed.transactions[1]).toMatchObject({
      date: "2026-09-27",
      amount: 2000,
      type: "credit",
      balance: 7000,
    });
    expect(parsed.transactions[2]).toMatchObject({
      date: "2026-09-24",
      amount: 18,
      type: "debit",
    });
    expect(parsed.transactions[3]).toMatchObject({
      date: "2026-09-20",
      amount: 50,
      type: "debit",
    });

    const normalized = normalizeTransactions(parsed.transactions, "UBA");
    for (const row of normalized) {
      const check = validateNormalizedTransaction(row);
      expect(check.valid, check.errors.join("; ")).toBe(true);
    }
  });

  it("AUTO detects UBA from the OLE workbook + filename", async () => {
    const detected = await detectBank(
      fixture,
      "OpTransactionHistoryUX527-09092026.xls",
    );
    expect(detected.bankCode).toBe("UBA");
    expect(detected.confidence).toBeGreaterThanOrEqual(70);

    const parsed = await parseBankStatement(
      fixture,
      "AUTO",
      "excel",
      undefined,
      "OpTransactionHistoryUX527-09092026.xls",
    );
    expect(parsed.detectedBankCode).toBe("UBA");
    expect(parsed.transactions).toHaveLength(4);
  });

  it("detects UBA from OLE magic even without a filename", async () => {
    const detected = await detectBank(fixture);
    expect(detected.bankCode).toBe("UBA");
  });

  it("parseExcel(UBA) finds the header under the search-criteria preamble", async () => {
    const result = await parseExcel(fixture, getBankConfig("UBA")!);
    expect(result.successfulRows).toBe(4);
    expect(result.errors).toHaveLength(0);
  });
});

describe("Live UBA OpTransactionHistory.xls (not committed — PII)", () => {
  it.skipIf(!liveXls)(
    "parses the attached internet-banking export",
    async () => {
      const buf = readFileSync(liveXls!);
      expect(buf.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))).toBe(
        true,
      );
      const parsed = await parseBankStatement(
        buf,
        "UBA",
        "excel",
        undefined,
        "OpTransactionHistoryUX527-09092026.xls",
      );
      expect(
        parsed.transactions.length,
        parsed.errors.map((error) => error.errorMessage).join("; "),
      ).toBeGreaterThanOrEqual(20);
      expect(parsed.transactions[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(parsed.transactions.some((row) => row.type === "credit")).toBe(true);
      expect(parsed.transactions.some((row) => row.type === "debit")).toBe(true);

      const auto = await parseBankStatement(
        buf,
        "AUTO",
        "excel",
        undefined,
        "OpTransactionHistoryUX527-09092026.xls",
      );
      expect(auto.detectedBankCode).toBe("UBA");
      expect(auto.transactions.length).toBe(parsed.transactions.length);
    },
  );
});

describe("Password PDF unlock is unchanged", () => {
  it("signals PASSWORD_REQUIRED for an /Encrypt dictionary without a password", async () => {
    const encrypted = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Encrypt 2 0 R /Filter /Standard >>\nendobj\n",
      "latin1",
    );
    await expect(parsePDF(encrypted, "UBA")).rejects.toThrow("PASSWORD_REQUIRED");
  });

  it.skipIf(!livePdf)(
    "attached statement.pdf still requires unlock",
    async () => {
      const buf = readFileSync(livePdf!);
      expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
      await expect(parsePDF(buf, "UBA")).rejects.toThrow("PASSWORD_REQUIRED");
    },
  );
});
