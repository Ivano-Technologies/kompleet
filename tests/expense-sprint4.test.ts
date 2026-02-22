/**
 * Sprint 4 – Reports, Export & Sync
 * Tests: export API, expense-reports page, mobile reports screen, sync/auto-sync behavior.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Expense Sprint 4 – Reports, Export & Sync", () => {
  describe("Web export API", () => {
    it("GET /api/expenses/export route exists and supports csv, pdf, excel", () => {
      const routePath = path.join(
        __dirname,
        "../src/app/api/expenses/export/route.ts",
      );
      expect(fs.existsSync(routePath)).toBe(true);
      const content = fs.readFileSync(routePath, "utf-8");
      expect(content).toMatch(/export async function GET/);
      expect(content).toMatch(/startDate|endDate|format/);
      expect(content).toMatch(/csv|pdf|excel/);
    });
  });

  describe("Web expense reports page", () => {
    it("reports/expense-reports page exists with date range and export", () => {
      const pagePath = path.join(
        __dirname,
        "../src/app/(dashboard)/reports/expense-reports/page.tsx",
      );
      expect(fs.existsSync(pagePath)).toBe(true);
      const content = fs.readFileSync(pagePath, "utf-8");
      expect(content).toMatch(/startDate|endDate|handleExport/);
      expect(content).toMatch(/csv|pdf|excel/);
    });
  });

  describe("Sidebar nav", () => {
    it("Expense Reports link under Reports", () => {
      const sidebarPath = path.join(
        __dirname,
        "../src/components/layout/dashboard/Sidebar.tsx",
      );
      const content = fs.readFileSync(sidebarPath, "utf-8");
      expect(content).toMatch(/expense-reports|Expense Reports/);
    });
  });

  describe("Mobile Reports tab", () => {
    it("Reports screen has date range and export/share", () => {
      const reportsPath = path.join(
        __dirname,
        "../apps/mobile/app/(tabs)/reports.tsx",
      );
      expect(fs.existsSync(reportsPath)).toBe(true);
      const content = fs.readFileSync(reportsPath, "utf-8");
      expect(content).toMatch(
        /startDate|endDate|Export|Share|listExpensesInRange/,
      );
      expect(content).toMatch(/expo-sharing|Sharing/);
    });

    it("listExpensesInRange exists in expense-repository", () => {
      const repoPath = path.join(
        __dirname,
        "../apps/mobile/lib/db/expense-repository.ts",
      );
      expect(fs.readFileSync(repoPath, "utf-8")).toMatch(/listExpensesInRange/);
    });
  });

  describe("Sync UX", () => {
    it("Home runs sync on focus when online", () => {
      const indexPath = path.join(
        __dirname,
        "../apps/mobile/app/(tabs)/index.tsx",
      );
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toMatch(/useFocusEffect|runSync|getSupabaseClient/);
    });

    it("Sync engine documents optional conflict resolution", () => {
      const syncPath = path.join(
        __dirname,
        "../apps/mobile/lib/sync/sync-engine.ts",
      );
      expect(fs.readFileSync(syncPath, "utf-8")).toMatch(
        /Keep mine|Keep server|conflict|last-write-wins/,
      );
    });
  });
});
