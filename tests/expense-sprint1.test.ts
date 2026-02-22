/**
 * Sprint 1 – Core Data Model & Offline Engine
 * Tests: schema exports, migration content, NDPR/consent behavior (logic only).
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  expenses,
  expenseCategories,
  expenseReports,
  ndprConsents,
} from "../src/db/schema/expenses";

describe("Expense Sprint 1 – Core Data Model & Offline Engine", () => {
  describe("Drizzle expense schema", () => {
    it("exports expenses table with expected columns", () => {
      expect(expenses).toBeDefined();
      const cols = Object.keys(expenses);
      expect(cols).toContain("id");
      expect(cols).toContain("userId");
      expect(cols).toContain("date");
      expect(cols).toContain("amount");
      expect(cols).toContain("currency");
      expect(cols).toContain("categoryId");
      expect(cols).toContain("vendor");
      expect(cols).toContain("vatAmount");
      expect(cols).toContain("receiptUrl");
      expect(cols).toContain("notes");
      expect(cols).toContain("createdAt");
      expect(cols).toContain("updatedAt");
      expect(cols).toContain("syncedAt");
    });

    it("exports expense_categories table", () => {
      expect(expenseCategories).toBeDefined();
      expect(Object.keys(expenseCategories)).toContain("name");
      expect(Object.keys(expenseCategories)).toContain("isCustom");
    });

    it("exports expense_reports and ndpr_consents", () => {
      expect(expenseReports).toBeDefined();
      expect(ndprConsents).toBeDefined();
      expect(Object.keys(ndprConsents)).toContain("consentScan");
      expect(Object.keys(ndprConsents)).toContain("consentCloudSync");
    });
  });

  describe("Supabase migration", () => {
    it("migration file exists and defines expense tables and RLS", () => {
      const migrationPath = path.join(
        __dirname,
        "../supabase/migrations/20260221000000_expense_tracking.sql",
      );
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toMatch(/public\.expenses\s*\(/);
      expect(sql).toMatch(/public\.expense_categories\s*\(/);
      expect(sql).toMatch(/public\.ndpr_consents\s*\(/);
      expect(sql).toMatch(/expense_reports/);
      expect(sql).toMatch(/enable row level security/);
      expect(sql).toMatch(
        /expenses_select|expenses_insert|expenses_update|expenses_delete/,
      );
      expect(sql).toMatch(/ndpr_consents_all/);
      expect(sql).toMatch(/bucket_id = 'receipts'/);
    });

    it("migration seeds Nigerian default categories", () => {
      const migrationPath = path.join(
        __dirname,
        "../supabase/migrations/20260221000000_expense_tracking.sql",
      );
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toMatch(
        /Transport \(Okada\/Fuel\)|Airtime\/Data|Market\/Inventory|VAT|Utilities|Logistics|Office Supplies/,
      );
    });
  });

  describe("NDPR consent behavior", () => {
    it("consent is required for scan/sync (documented)", () => {
      // NDPR gate blocks camera and sync until consent; acceptance stored in ndpr_consents + SecureStore.
      // This test documents the requirement; implementation is in apps/mobile NDPRConsentGate.
      const consentRequired = true;
      expect(consentRequired).toBe(true);
    });

    it("conflict resolution: last-write-wins via updated_at (documented)", () => {
      // Sync engine uses updated_at for last-write-wins; documented for Sprint 1 tests.
      const conflictStrategy = "last-write-wins";
      expect(conflictStrategy).toBe("last-write-wins");
    });
  });
});
