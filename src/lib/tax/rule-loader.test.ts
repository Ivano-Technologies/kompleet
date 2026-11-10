import { describe, expect, it } from "vitest";
import {
  isUnverifiedUsedRule,
  unverifiedUsedRuleKeys,
} from "./rule-loader";
import { buildMockRuleBundle } from "../../../tests/helpers/mock-rule-bundle";

describe("unverified used-rule detection", () => {
  it("flags a rule marked unverified even on the active version", () => {
    const bundle = buildMockRuleBundle({
      business_tax: {
        minimum_etr: {
          value: { rate: 15 },
          confidenceLevel: "unverified",
        },
      },
    });
    const rule = bundle.rules.get("business_tax.minimum_etr");
    expect(rule).toBeDefined();
    expect(isUnverifiedUsedRule(rule!, bundle)).toBe(true);
  });

  it("flags a high-confidence rule from the unverified version", () => {
    const bundle = buildMockRuleBundle(
      {
        business_tax: {
          minimum_etr: {
            value: { rate: 15 },
            confidenceLevel: "high",
            ruleVersionId: "inactive-v",
          },
        },
      },
      {
        activeVersionId: "active-v",
        unverifiedVersionId: "inactive-v",
      },
    );
    const rule = bundle.rules.get("business_tax.minimum_etr");
    expect(isUnverifiedUsedRule(rule!, bundle)).toBe(true);
  });

  it("flags a rule whose version is not the active version", () => {
    const bundle = buildMockRuleBundle(
      {
        business_tax: {
          minimum_etr: {
            value: { rate: 15 },
            confidenceLevel: "high",
            ruleVersionId: "older-inactive",
          },
        },
      },
      { activeVersionId: "active-v", unverifiedVersionId: "other-inactive" },
    );
    const rule = bundle.rules.get("business_tax.minimum_etr");
    expect(isUnverifiedUsedRule(rule!, bundle)).toBe(true);
  });

  it("does not flag a high-confidence active rule", () => {
    const bundle = buildMockRuleBundle({
      business_tax: {
        corporate_tax_rate_other: { value: { rate: 30 } },
      },
    });
    const rule = bundle.rules.get("business_tax.corporate_tax_rate_other");
    expect(isUnverifiedUsedRule(rule!, bundle)).toBe(false);
  });

  it("returns only keys that were used", () => {
    const bundle = buildMockRuleBundle({
      business_tax: {
        minimum_etr: {
          value: { rate: 15 },
          confidenceLevel: "unverified",
        },
        very_large_turnover_threshold: {
          value: { threshold: 20_000_000_000 },
          confidenceLevel: "unverified",
        },
      },
    });

    expect(
      unverifiedUsedRuleKeys(bundle, ["business_tax.minimum_etr"]),
    ).toEqual(["business_tax.minimum_etr"]);
  });
});
