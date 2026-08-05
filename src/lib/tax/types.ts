/**
 * Tax Rule Bundle Types
 * =====================
 * Shared types for loading and consuming tax_rules rows without ever
 * falling back to a hardcoded rate. See docs/TAX_RULE_PROVENANCE.md.
 */

export type RuleConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "unverified"
  | "verified";

/**
 * A single tax_rules row, normalized for in-memory lookups.
 */
export interface LoadedRule {
  ruleType: string;
  ruleKey: string;
  /** Raw JSONB rule_value payload (shape varies per rule_type/rule_key). */
  value: Record<string, any>;
  confidenceLevel: RuleConfidenceLevel;
  sourceId: string;
  ruleVersionId: string;
  notes: string | null;
  lastReviewedAt: string;
}

/**
 * A resolved set of tax rules for a computation.
 *
 * Populated by `loadRuleBundle`: rules from the active rule_version take
 * priority; rules from the most-recent INACTIVE ("unverified candidates")
 * rule_version only fill in keys that have no active/verified counterpart.
 * An active, reviewed rule is never overridden by an unverified one.
 */
export interface RuleBundle {
  activeVersionId: string | null;
  /** Most-recent inactive rule_version used to fill gaps, if any. */
  unverifiedVersionId: string | null;
  /** Keyed by `${ruleType}.${ruleKey}`. */
  rules: Map<string, LoadedRule>;
}
