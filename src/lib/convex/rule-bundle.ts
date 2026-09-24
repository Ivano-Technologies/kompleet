import type { ConvexHttpClient } from "convex/browser";
import { api } from "./http";
import type { LoadedRule, RuleBundle } from "@/lib/tax/types";

export async function loadConvexRuleBundle(
  convex: ConvexHttpClient,
  ruleTypes?: string[],
): Promise<RuleBundle> {
  const data = await convex.query(api.tax.loadRuleBundle, {
    ruleTypes,
  });
  const rules = new Map<string, LoadedRule>();
  for (const row of data.rules) {
    const rule = row as {
      rule_type: string;
      rule_key: string;
      rule_value: Record<string, unknown>;
      confidence_level: LoadedRule["confidenceLevel"];
      source_id: string | null;
      rule_version_id: string;
      notes: string | null;
      last_reviewed_at: string | null;
    };
    rules.set(`${rule.rule_type}.${rule.rule_key}`, {
      ruleType: rule.rule_type,
      ruleKey: rule.rule_key,
      value: rule.rule_value,
      confidenceLevel: rule.confidence_level,
      sourceId: rule.source_id ?? "",
      ruleVersionId: rule.rule_version_id,
      notes: rule.notes,
      lastReviewedAt: rule.last_reviewed_at ?? "",
    });
  }
  return {
    activeVersionId: data.activeVersionId,
    unverifiedVersionId: data.unverifiedVersionId,
    rules,
  };
}
