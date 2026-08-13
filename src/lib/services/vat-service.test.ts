import { describe, it, expect } from "vitest";
import { VATService, VATTransaction } from "./vat-service";
import { buildMockRuleBundle } from "../../../tests/helpers/mock-rule-bundle";

/**
 * Bundle mirroring the active seed (populate_tax_rules.sql) plus the
 * unverified candidates from
 * supabase/migrations/20260805140000_tax_rule_provenance_unverified.sql.
 */
const bundle = buildMockRuleBundle({
  vat: {
    standard_rate: { value: { rate: 7.5, unit: "percentage" } },
    rent_exemption: {
      value: {
        exempt: true,
        items: [
          "land_rent",
          "building_rent",
          "interest_in_land",
          "interest_in_building",
        ],
      },
    },
    zero_rate: {
      value: { rate: 0, unit: "percentage" },
      confidenceLevel: "unverified",
    },
    registration_threshold_legacy_25m: {
      value: { threshold: 25_000_000, operator: ">=" },
      confidenceLevel: "unverified",
    },
    small_business_exemption_100m: {
      value: { threshold: 100_000_000, operator: "<" },
      confidenceLevel: "unverified",
    },
    small_business_exemption_50m: {
      value: { threshold: 50_000_000, operator: "<" },
      confidenceLevel: "unverified",
    },
    small_business_exemption_assets_for_100m: {
      value: { threshold: 250_000_000, operator: "<" },
      confidenceLevel: "unverified",
    },
    small_business_exemption_assets_for_50m: {
      value: { threshold: 250_000_000, operator: "<" },
      confidenceLevel: "unverified",
    },
  },
});

/** Bundle with only the rent exemption rule (no standard/zero rate). */
const rentOnlyBundle = buildMockRuleBundle({
  vat: {
    rent_exemption: { value: { exempt: true, items: ["building_rent"] } },
  },
});

describe("VAT Service", () => {
  describe("VAT Treatment Determination", () => {
    it("should classify unregistered business income as out-of-scope", () => {
      const treatment = VATService.determineVATTreatment(
        bundle,
        "office_supplies",
        "income",
        false,
      );
      expect(treatment).toBe("out-of-scope");
    });

    it("should classify rent as exempt using the verified rent exemption rule", () => {
      const treatment = VATService.determineVATTreatment(
        rentOnlyBundle,
        "residential_rent",
        "income",
        true,
      );
      expect(treatment).toBe("exempt");
    });

    it("should throw for any non-rent category since the exempt/zero-rated schedule is unverified", () => {
      expect(() =>
        VATService.determineVATTreatment(bundle, "office_supplies", "income", true),
      ).toThrow(/category schedule unavailable/i);
    });

    it("should throw for zero-rated-sounding categories since no zero-rated schedule is seeded", () => {
      expect(() =>
        VATService.determineVATTreatment(bundle, "exported_goods", "income", true),
      ).toThrow(/category schedule unavailable/i);
    });

    it("should throw for expense categories too (registration doesn't grant a category schedule)", () => {
      expect(() =>
        VATService.determineVATTreatment(bundle, "office_supplies", "expense", false),
      ).toThrow(/category schedule unavailable/i);
    });
  });

  describe("Transaction VAT Calculation", () => {
    it("should calculate VAT on standard-rated income using the standard_rate rule", () => {
      const transaction: VATTransaction = {
        id: "1",
        type: "income",
        amount: 100_000,
        description: "Sales",
        date: "2026-02-01",
        category: "sales",
        vatTreatment: "standard",
      };

      const calculation = VATService.calculateTransactionVAT(transaction, bundle);

      expect(calculation.vatRate).toBe(0.075);
      expect(calculation.vatAmount).toBe(7_500);
      expect(calculation.netAmount).toBe(107_500);
      expect(calculation.isRecoverable).toBe(false);
    });

    it("should throw if the standard_rate rule is missing from the bundle", () => {
      const emptyBundle = buildMockRuleBundle({});
      const transaction: VATTransaction = {
        id: "1",
        type: "income",
        amount: 100_000,
        description: "Sales",
        date: "2026-02-01",
        category: "sales",
        vatTreatment: "standard",
      };

      expect(() =>
        VATService.calculateTransactionVAT(transaction, emptyBundle),
      ).toThrow(/Missing tax rule "vat\.standard_rate"/);
    });

    it("should calculate recoverable VAT on expenses", () => {
      const transaction: VATTransaction = {
        id: "2",
        type: "expense",
        amount: 50_000,
        description: "Office supplies",
        date: "2026-02-01",
        category: "office_supplies",
        vatTreatment: "standard",
        vatRecoverable: true,
      };

      const calculation = VATService.calculateTransactionVAT(transaction, bundle);

      expect(calculation.vatAmount).toBe(3_750);
      expect(calculation.isRecoverable).toBe(true);
    });

    it("should not charge VAT on exempt supplies", () => {
      const transaction: VATTransaction = {
        id: "3",
        type: "income",
        amount: 100_000,
        description: "Medical services",
        date: "2026-02-01",
        category: "medical_services",
        vatTreatment: "exempt",
      };

      const calculation = VATService.calculateTransactionVAT(transaction, bundle);

      expect(calculation.vatAmount).toBe(0);
      expect(calculation.vatTreatment).toBe("exempt");
      expect(calculation.isRecoverable).toBe(false);
    });

    it("should charge zero VAT on zero-rated supplies (using unverified vat.zero_rate) but allow recovery", () => {
      const transaction: VATTransaction = {
        id: "4",
        type: "expense",
        amount: 50_000,
        description: "Exported goods",
        date: "2026-02-01",
        category: "exported_goods",
        vatTreatment: "zero-rated",
      };

      const calculation = VATService.calculateTransactionVAT(transaction, bundle);

      expect(calculation.vatAmount).toBe(0);
      expect(calculation.vatTreatment).toBe("zero-rated");
      expect(calculation.isRecoverable).toBe(true);
    });

    it("should not charge VAT for unregistered business (trusts pre-set out-of-scope treatment)", () => {
      const transaction: VATTransaction = {
        id: "5",
        type: "income",
        amount: 100_000,
        description: "Sales",
        date: "2026-02-01",
        category: "sales",
        vatTreatment: "out-of-scope",
      };

      const calculation = VATService.calculateTransactionVAT(transaction, bundle);

      expect(calculation.vatAmount).toBe(0);
      expect(calculation.vatTreatment).toBe("out-of-scope");
    });
  });

  describe("VAT Summary Calculation", () => {
    it("should calculate VAT summary for a period", () => {
      const transactions: VATTransaction[] = [
        {
          id: "1",
          type: "income",
          amount: 1_000_000,
          description: "Sales",
          date: "2026-02-01",
          category: "sales",
          vatTreatment: "standard",
        },
        {
          id: "2",
          type: "expense",
          amount: 500_000,
          description: "Purchases",
          date: "2026-02-05",
          category: "purchases",
          vatTreatment: "standard",
          vatRecoverable: true,
        },
      ];

      const summary = VATService.calculateVATSummary(
        transactions,
        "2026-02",
        true,
        bundle,
      );

      expect(summary.totalSalesGross).toBe(1_000_000);
      expect(summary.totalSalesVAT).toBe(75_000);
      expect(summary.totalPurchasesGross).toBe(500_000);
      expect(summary.totalPurchasesVAT).toBe(37_500);
      expect(summary.recoverableVAT).toBe(37_500);
      expect(summary.netVATPayable).toBe(37_500); // 75,000 - 37,500
    });

    it("should calculate correct filing deadline", () => {
      const summary = VATService.calculateVATSummary([], "2026-01", true, bundle);

      // Q1 (Jan-Mar) deadline is last day of April
      expect(summary.filingDeadline).toBe("2026-04-28");
    });

    it("should handle zero-rated supplies correctly", () => {
      const transactions: VATTransaction[] = [
        {
          id: "1",
          type: "income",
          amount: 500_000,
          description: "Exported goods",
          date: "2026-02-01",
          category: "exported_goods",
          vatTreatment: "zero-rated",
        },
        {
          id: "2",
          type: "expense",
          amount: 100_000,
          description: "Input VAT",
          date: "2026-02-05",
          category: "purchases",
          vatTreatment: "standard",
          vatRecoverable: true,
        },
      ];

      const summary = VATService.calculateVATSummary(
        transactions,
        "2026-02",
        true,
        bundle,
      );

      expect(summary.totalSalesVAT).toBe(0); // Zero-rated
      expect(summary.recoverableVAT).toBe(7_500); // Input VAT recoverable
      expect(summary.netVATPayable).toBe(-7_500); // Refund due
    });

    it("should handle empty transaction list", () => {
      const summary = VATService.calculateVATSummary([], "2026-02", true, bundle);

      expect(summary.totalSalesGross).toBe(0);
      expect(summary.totalSalesVAT).toBe(0);
      expect(summary.netVATPayable).toBe(0);
    });
  });

  describe("VAT Registration Obligation", () => {
    it("returns unresolved with all three mutually exclusive candidates", () => {
      const obligation = VATService.getRegistrationObligation(
        bundle,
        30_000_000,
        10_000_000,
      );

      expect(obligation.status).toBe("unresolved");
      if (obligation.status === "unresolved") {
        expect(obligation.candidates).toHaveLength(3);
        expect(
          obligation.candidates.map((c) => c.ruleKey).sort(),
        ).toEqual(
          [
            "registration_threshold_legacy_25m",
            "small_business_exemption_100m",
            "small_business_exemption_50m",
          ].sort(),
        );
      }
    });

    it("never asserts a definitive registered/exempt boolean", () => {
      const obligation = VATService.getRegistrationObligation(bundle, 60_000_000);
      expect(obligation).not.toHaveProperty("isRegistered");
      expect(obligation).not.toHaveProperty("isExempt");
    });

    it("returns no_data when no threshold rules are loaded", () => {
      const emptyBundle = buildMockRuleBundle({});
      const obligation = VATService.getRegistrationObligation(emptyBundle, 1_000_000);
      expect(obligation.status).toBe("no_data");
    });
  });

  describe("VAT Forms Generation", () => {
    it("should generate Form A for registered traders", () => {
      const transactions: VATTransaction[] = [
        {
          id: "1",
          type: "income",
          amount: 1_000_000,
          description: "Sales",
          date: "2026-02-01",
          category: "sales",
          vatTreatment: "standard",
        },
      ];

      const summary = VATService.calculateVATSummary(
        transactions,
        "2026-02",
        true,
        bundle,
      );
      const form = VATService.generateFormA(summary, "Test Business", "TIN123456");

      expect(form.formType).toBe("A");
      expect(form.businessName).toBe("Test Business");
      expect(form.tinNumber).toBe("TIN123456");
      expect(form.outputVAT).toBe(75_000);
    });

    it("should throw error generating Form A for unregistered trader", () => {
      const summary = VATService.calculateVATSummary([], "2026-02", false, bundle);

      expect(() => {
        VATService.generateFormA(summary, "Test Business", "TIN123456");
      }).toThrow();
    });

    it("should generate Form B for non-registered traders", () => {
      const form = VATService.generateFormB(10_000_000, "Small Business");

      expect(form.formType).toBe("B");
      expect(form.businessName).toBe("Small Business");
      expect(form.totalTurnover).toBe(10_000_000);
    });
  });

  describe("VAT Price Calculations", () => {
    it("should require an explicit rate to extract VAT from an inclusive price", () => {
      const result = VATService.extractVATFromInclusive(107_500, 0.075);

      expect(result.netAmount).toBe(100_000);
      expect(result.vatAmount).toBe(7_500);
    });

    it("should require an explicit rate to add VAT to an exclusive price", () => {
      const result = VATService.addVATToExclusive(100_000, 0.075);

      expect(result.netAmount).toBe(100_000);
      expect(result.vatAmount).toBe(7_500);
      expect(result.inclusivePrice).toBe(107_500);
    });

    it("should handle custom VAT rates", () => {
      const result = VATService.addVATToExclusive(100_000, 0.05);

      expect(result.vatAmount).toBe(5_000);
      expect(result.inclusivePrice).toBe(105_000);
    });
  });

  describe("VAT Compliance Validation", () => {
    it("should validate compliant VAT summary", () => {
      const transactions: VATTransaction[] = [
        {
          id: "1",
          type: "income",
          amount: 1_000_000,
          description: "Sales",
          date: "2026-02-01",
          category: "sales",
          vatTreatment: "standard",
        },
      ];

      const summary = VATService.calculateVATSummary(
        transactions,
        "2026-02",
        true,
        bundle,
      );
      const validation = VATService.validateCompliance(summary, bundle);

      expect(validation.isCompliant).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it("should warn (never hard-fail) about an unresolved VAT threshold for unregistered high-turnover businesses", () => {
      const transactions: VATTransaction[] = [
        {
          id: "1",
          type: "income",
          amount: 30_000_000,
          description: "Sales",
          date: "2026-02-01",
          category: "sales",
          vatTreatment: "out-of-scope",
        },
      ];

      const summary = VATService.calculateVATSummary(
        transactions,
        "2026-02",
        false,
        bundle,
      );
      const validation = VATService.validateCompliance(summary, bundle);

      // Never assert non-compliance from an unresolved threshold conflict.
      expect(validation.issues).toHaveLength(0);
      expect(
        validation.warnings.some((w) => /unresolved/i.test(w)),
      ).toBe(true);
    });

    it("should warn about VAT refund due", () => {
      const transactions: VATTransaction[] = [
        {
          id: "1",
          type: "expense",
          amount: 1_000_000,
          description: "Purchases",
          date: "2026-02-01",
          category: "purchases",
          vatTreatment: "standard",
          vatRecoverable: true,
        },
      ];

      const summary = VATService.calculateVATSummary(
        transactions,
        "2026-02",
        true,
        bundle,
      );
      const validation = VATService.validateCompliance(summary, bundle);

      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero amounts", () => {
      const transaction: VATTransaction = {
        id: "1",
        type: "income",
        amount: 0,
        description: "Zero transaction",
        date: "2026-02-01",
        category: "sales",
        vatTreatment: "standard",
      };

      const calculation = VATService.calculateTransactionVAT(transaction, bundle);

      expect(calculation.vatAmount).toBe(0);
      expect(calculation.netAmount).toBe(0);
    });

    it("should handle very large amounts", () => {
      const transaction: VATTransaction = {
        id: "1",
        type: "income",
        amount: 1_000_000_000,
        description: "Large transaction",
        date: "2026-02-01",
        category: "sales",
        vatTreatment: "standard",
      };

      const calculation = VATService.calculateTransactionVAT(transaction, bundle);

      expect(calculation.vatAmount).toBe(75_000_000);
    });
  });
});
