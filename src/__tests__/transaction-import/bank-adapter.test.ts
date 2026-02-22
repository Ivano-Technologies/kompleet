/**
 * Bank Adapter Tests (TDD Priority 0)
 * parseBankStatement delegates to PDF/CSV/Excel parsers and returns ParseResult.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseBankStatement,
  detectFileType,
  isValidBankCode,
  getSupportedBanks,
} from "../../lib/transaction-import/bank-adapter";

// Mock pdf-parser so we don't run real PDF/OpenAI in tests
vi.mock("../../lib/transaction-import/pdf-parser", () => ({
  parsePDF: vi.fn().mockResolvedValue({
    transactions: [],
    errors: [],
    totalRows: 0,
    successfulRows: 0,
  }),
}));

// Mock csv-parser
vi.mock("../../lib/transaction-import/csv-parser", () => ({
  parseCSV: vi.fn().mockResolvedValue({
    transactions: [
      {
        date: "2026-01-01",
        merchant: "Test",
        amount: 100,
        type: "debit" as const,
        balance: 900,
        rawData: {},
      },
    ],
    errors: [],
    totalRows: 1,
    successfulRows: 1,
  }),
}));

// Mock excel-parser
vi.mock("../../lib/transaction-import/excel-parser", () => ({
  parseExcel: vi.fn().mockResolvedValue({
    transactions: [],
    errors: [],
    totalRows: 0,
    successfulRows: 0,
  }),
}));

describe("Bank Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("detectFileType", () => {
    it("returns csv for .csv extension", () => {
      expect(detectFileType("statement.csv")).toBe("csv");
      expect(detectFileType("file.CSV")).toBe("csv");
    });
    it("returns excel for .xlsx and .xls", () => {
      expect(detectFileType("book.xlsx")).toBe("excel");
      expect(detectFileType("book.xls")).toBe("excel");
    });
    it("returns pdf for .pdf extension", () => {
      expect(detectFileType("statement.pdf")).toBe("pdf");
    });
    it("throws for unsupported extension", () => {
      expect(() => detectFileType("file.txt")).toThrow(
        /Cannot detect file type/,
      );
    });
  });

  describe("isValidBankCode", () => {
    it("returns true for known bank codes", () => {
      expect(isValidBankCode("GTB")).toBe(true);
      expect(isValidBankCode("gtb")).toBe(true);
    });
    it("returns false for unknown code", () => {
      expect(isValidBankCode("XXX")).toBe(false);
    });
  });

  describe("getSupportedBanks", () => {
    it("returns non-empty list of banks with code and name", () => {
      const banks = getSupportedBanks();
      expect(Array.isArray(banks)).toBe(true);
      expect(banks.length).toBeGreaterThan(0);
      expect(banks[0]).toHaveProperty("code");
      expect(banks[0]).toHaveProperty("name");
    });
  });

  describe("parseBankStatement", () => {
    it("for PDF calls parsePDF and returns ParseResult shape", async () => {
      const buffer = Buffer.alloc(100);
      const result = await parseBankStatement(buffer, "GTB", "pdf");

      expect(result).toHaveProperty("transactions");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("totalRows");
      expect(result).toHaveProperty("successfulRows");
      expect(Array.isArray(result.transactions)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("for CSV with valid bank code returns ParseResult", async () => {
      const content =
        "Date,Details,Debit,Credit,Balance\n01/01/2026,Test,100,0,900";
      const result = await parseBankStatement(content, "GTB", "csv");

      expect(result.transactions).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(typeof result.totalRows).toBe("number");
      expect(typeof result.successfulRows).toBe("number");
    });

    it("for Excel with valid bank code returns ParseResult", async () => {
      const buffer = Buffer.alloc(200);
      const result = await parseBankStatement(buffer, "GTB", "excel");

      expect(result).toHaveProperty("transactions");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("totalRows");
      expect(result).toHaveProperty("successfulRows");
    });

    it("throws for invalid bank code on CSV", async () => {
      await expect(
        parseBankStatement("a,b,c", "INVALID", "csv"),
      ).rejects.toThrow(/Unsupported bank/);
    });
  });
});
