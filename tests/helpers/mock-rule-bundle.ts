/**
 * Test helper for constructing a `RuleBundle` in-memory, without hitting
 * Supabase. Used by unit tests for services that consume rule bundles
 * (VATService, TaxComputationService) so tests stay fast and deterministic.
 */
import type {
  LoadedRule,
  RuleBundle,
  RuleConfidenceLevel,
} from "@/lib/tax/types";

export interface MockRuleSeed {
  value: Record<string, any>;
  confidenceLevel?: RuleConfidenceLevel;
  notes?: string | null;
}

/**
 * Build a RuleBundle from a nested `{ ruleType: { ruleKey: seed } }` map.
 */
export function buildMockRuleBundle(
  rulesByTypeAndKey: Record<string, Record<string, MockRuleSeed>>,
): RuleBundle {
  const rules = new Map<string, LoadedRule>();

  for (const [ruleType, keys] of Object.entries(rulesByTypeAndKey)) {
    for (const [ruleKey, seed] of Object.entries(keys)) {
      rules.set(`${ruleType}.${ruleKey}`, {
        ruleType,
        ruleKey,
        value: seed.value,
        confidenceLevel: seed.confidenceLevel ?? "high",
        sourceId: "test-source",
        ruleVersionId: "test-active-version",
        notes: seed.notes ?? null,
        lastReviewedAt: new Date("2026-01-01").toISOString(),
      });
    }
  }

  return {
    activeVersionId: "test-active-version",
    unverifiedVersionId: null,
    rules,
  };
}
