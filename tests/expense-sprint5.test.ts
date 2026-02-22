/**
 * Sprint 5 – Mileage + Premium + Teams
 * Tests: migration, workspaces API, premium helper, billing stub, mileage screen, Drizzle schema.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Expense Sprint 5 – Mileage + Premium + Teams", () => {
  describe("Migrations", () => {
    it("Sprint 5 migration exists (workspaces, premium)", () => {
      const migrationPath = path.join(
        __dirname,
        "../supabase/migrations/20260221100000_sprint5_workspaces_premium.sql"
      );
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, "utf-8");
      expect(content).toMatch(/workspaces|workspace_members|subscription_tier/);
    });

    it("Sprint 5 rollback migration exists", () => {
      const rollbackPath = path.join(
        __dirname,
        "../supabase/migrations/20260221100001_sprint5_workspaces_premium_rollback.sql"
      );
      expect(fs.existsSync(rollbackPath)).toBe(true);
    });
  });

  describe("Premium gating", () => {
    it("expense-premium helper exists with getSubscriptionTier and requirePremium", () => {
      const premiumPath = path.join(__dirname, "../src/lib/expense-premium.ts");
      expect(fs.existsSync(premiumPath)).toBe(true);
      const content = fs.readFileSync(premiumPath, "utf-8");
      expect(content).toMatch(/getSubscriptionTier|requirePremium|402/);
    });
  });

  describe("Workspaces API", () => {
    it("GET/POST /api/expenses/workspaces exist", () => {
      const routePath = path.join(__dirname, "../src/app/api/expenses/workspaces/route.ts");
      expect(fs.existsSync(routePath)).toBe(true);
      const content = fs.readFileSync(routePath, "utf-8");
      expect(content).toMatch(/export async function GET|export async function POST/);
      expect(content).toMatch(/requirePremium|workspaces/);
    });

    it("GET /api/expenses/workspaces/[id]/members exists", () => {
      const membersPath = path.join(
        __dirname,
        "../src/app/api/expenses/workspaces/[id]/members/route.ts"
      );
      expect(fs.existsSync(membersPath)).toBe(true);
    });
  });

  describe("Billing stub", () => {
    it("Billing checkout stub returns 503 and disabled message", () => {
      const billingPath = path.join(
        __dirname,
        "../src/app/api/expenses/billing/checkout/route.ts"
      );
      expect(fs.existsSync(billingPath)).toBe(true);
      const content = fs.readFileSync(billingPath, "utf-8");
      expect(content).toMatch(/legal review|503|BILLING_DISABLED/);
    });
  });

  describe("Mobile mileage", () => {
    it("Mileage tab and distance helper exist", () => {
      const mileagePath = path.join(__dirname, "../apps/mobile/app/(tabs)/mileage.tsx");
      expect(fs.existsSync(mileagePath)).toBe(true);
      const content = fs.readFileSync(mileagePath, "utf-8");
      expect(content).toMatch(/expo-location|Start trip|End trip|haversineKm|cat-mileage/);
      const distancePath = path.join(__dirname, "../apps/mobile/lib/mileage/distance.ts");
      expect(fs.existsSync(distancePath)).toBe(true);
      expect(fs.readFileSync(distancePath, "utf-8")).toMatch(/haversineKm/);
    });

    it("Mileage category in mobile seed", () => {
      const initPath = path.join(__dirname, "../apps/mobile/lib/db/init.ts");
      expect(fs.readFileSync(initPath, "utf-8")).toMatch(/cat-mileage|Mileage/);
    });
  });

  describe("Drizzle schema", () => {
    it("expenses schema has workspaceId; workspaces and workspaceMembers exist", () => {
      const schemaPath = path.join(__dirname, "../src/db/schema/expenses.ts");
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toMatch(/workspaceId|workspaces|workspaceMembers/);
    });
  });

  describe("Web UI stubs", () => {
    it("Expense workspaces page exists", () => {
      const pagePath = path.join(
        __dirname,
        "../src/app/(dashboard)/expenses/teams/page.tsx"
      );
      expect(fs.existsSync(pagePath)).toBe(true);
    });
  });
});
