/**
 * Bank Detector Tests
 * ====================
 * Tests for automatic bank detection from CSV files
 */

import { describe, it, expect } from "vitest";
import {
  detectBankFromCSV,
  detectBank,
} from "@/lib/transaction-import/bank-detector";
import { readFileSync } from "fs";
import { join } from "path";

describe("Bank Detector", () => {
  describe("detectBankFromCSV", () => {
    it("should detect Moniepoint from CSV file", async () => {
      const filePath = join(
        process.cwd(),
        "tests/fixtures/banks/moniepoint_sample1.csv",
      );
      const fileBuffer = readFileSync(filePath);

      const result = await detectBankFromCSV(
        fileBuffer,
        "moniepoint_sample1.csv",
      );

      expect(result.bankCode).toBe("MON");
      expect(result.confidence).toBeGreaterThanOrEqual(70);
      expect(result.matchedFeatures.length).toBeGreaterThan(0);
    });

    it("should detect GTBank from CSV file", async () => {
      const filePath = join(
        process.cwd(),
        "tests/fixtures/banks/gtbank_sample1.csv",
      );
      const fileBuffer = readFileSync(filePath);

      const result = await detectBankFromCSV(fileBuffer, "gtbank_sample1.csv");

      expect(result.bankCode).toBe("GTB");
      expect(result.confidence).toBeGreaterThanOrEqual(70);
      expect(result.matchedFeatures.length).toBeGreaterThan(0);
    });

    it("should return null for unrecognized bank format", async () => {
      const unknownCSV = Buffer.from("Col1,Col2,Col3\nVal1,Val2,Val3\n");

      const result = await detectBankFromCSV(unknownCSV, "unknown.csv");

      expect(result.bankCode).toBeNull();
      expect(result.confidence).toBeLessThan(70);
    });

    it("should detect bank from filename pattern", async () => {
      const filePath = join(
        process.cwd(),
        "tests/fixtures/banks/moniepoint_sample1.csv",
      );
      const fileBuffer = readFileSync(filePath);

      const result = await detectBankFromCSV(
        fileBuffer,
        "my_moniepoint_statement.csv",
      );

      expect(result.bankCode).toBe("MON");
      expect(result.matchedFeatures.some((f) => f.includes("Filename"))).toBe(
        true,
      );
    });
  });

  describe("detectBank", () => {
    it("should auto-detect file type and bank", async () => {
      const filePath = join(
        process.cwd(),
        "tests/fixtures/banks/moniepoint_sample1.csv",
      );
      const fileBuffer = readFileSync(filePath);

      const result = await detectBank(fileBuffer, "statement.csv");

      expect(result.bankCode).toBe("MON");
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });
  });

  describe("Header Matching", () => {
    it("should match headers with high confidence", async () => {
      // Moniepoint headers
      const csvContent =
        "Date,Narration,Debit,Credit,Balance,Reference\n15/01/2026,Test,,1000,5000,REF001";
      const buffer = Buffer.from(csvContent);

      const result = await detectBankFromCSV(buffer);

      expect(result.bankCode).toBe("MON");
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    it("should handle case-insensitive header matching", async () => {
      const csvContent =
        "DATE,NARRATION,DEBIT,CREDIT,BALANCE,REFERENCE\n15/01/2026,Test,,1000,5000,REF001";
      const buffer = Buffer.from(csvContent);

      const result = await detectBankFromCSV(buffer);

      expect(result.bankCode).toBe("MON");
    });
  });
});
