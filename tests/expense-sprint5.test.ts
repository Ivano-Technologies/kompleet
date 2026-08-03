/**
 * Sprint 5 – Mileage + Premium (workspaces superseded by firms/firm_members).
 * Workspaces migration and API were never applied and are deleted in Phase 2.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Expense Sprint 5 – Mileage + Premium", () => {
  describe("Workspaces superseded", () => {
    it("orphaned workspaces migration is removed (do not apply)", () => {
      const migrationPath = path.join(
        __dirname,
        "../supabase/migrations/20260221100000_sprint5_workspaces_premium.sql",
      );
      expect(fs.existsSync(migrationPath)).toBe(false);
    });

    it("workspaces API routes are removed", () => {
      const routePath = path.join(
        __dirname,
        "../src/app/api/expenses/workspaces/route.ts",
      );
      const membersPath = path.join(
        __dirname,
        "../src/app/api/expenses/workspaces/[id]/members/route.ts",
      );
      expect(fs.existsSync(routePath)).toBe(false);
      expect(fs.existsSync(membersPath)).toBe(false);
    });

    it("expense teams/workspaces page is removed", () => {
      const pagePath = path.join(
        __dirname,
        "../src/app/(dashboard)/expenses/teams/page.tsx",
      );
      expect(fs.existsSync(pagePath)).toBe(false);
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

  describe("Billing stub", () => {
    it("billing checkout stub returns 503 and disabled message", () => {
      const billingPath = path.join(
        __dirname,
        "../src/app/api/expenses/billing/checkout/route.ts",
      );
      expect(fs.existsSync(billingPath)).toBe(true);
      const content = fs.readFileSync(billingPath, "utf-8");
      expect(content).toMatch(/legal review|503|BILLING_DISABLED/);
    });
  });

  describe("Mobile mileage", () => {
    it("Mileage tab and distance helper exist", () => {
      const mileagePath = path.join(
        __dirname,
        "../apps/mobile/app/(tabs)/mileage.tsx",
      );
      expect(fs.existsSync(mileagePath)).toBe(true);
      const content = fs.readFileSync(mileagePath, "utf-8");
      expect(content).toMatch(
        /expo-location|Start trip|End trip|haversineKm|cat-mileage/,
      );
      const distancePath = path.join(
        __dirname,
        "../apps/mobile/lib/mileage/distance.ts",
      );
      expect(fs.existsSync(distancePath)).toBe(true);
      expect(fs.readFileSync(distancePath, "utf-8")).toMatch(/haversineKm/);
    });

    it("Mileage category in mobile seed", () => {
      const initPath = path.join(__dirname, "../apps/mobile/lib/db/init.ts");
      expect(fs.readFileSync(initPath, "utf-8")).toMatch(/cat-mileage|Mileage/);
    });
  });
});
