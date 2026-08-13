/**
 * Tax Rule Loader
 * ===============
 * Loads a `RuleBundle` from Supabase and provides strict accessors
 * (`requireRule`) that throw `MissingTaxRuleError` instead of ever
 * returning/assuming a hardcoded default.
 *
 * Loading strategy (documented per PR 3a):
 *   1. Load ALL tax_rules rows for the active rule_version (optionally
 *      filtered to a set of rule_types). These are the verified/reviewed
 *      figures and always take priority.
 *   2. Separately load ALL tax_rules rows for the most-recently-created
 *      INACTIVE rule_version (i.e. the "unverified candidates" version
 *      seeded by supabase/migrations/20260805140000_tax_rule_provenance_unverified.sql).
 *   3. Merge step 2 into the bundle ONLY for keys that are missing from
 *      step 1. An active, reviewed rule is never overridden by an
 *      unverified one — unverified rules only fill gaps.
 *
 * Callers that need to distinguish verified vs. unverified figures should
 * inspect `LoadedRule.confidenceLevel` on the returned rule.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultAnonClient } from "@/lib/supabase";
import { MissingTaxRuleError } from "./errors";
import type { LoadedRule, RuleBundle } from "./types";

function ruleMapKey(ruleType: string, ruleKey: string): string {
  return `${ruleType}.${ruleKey}`;
}

function toLoadedRule(row: Record<string, any>): LoadedRule {
  return {
    ruleType: row.rule_type,
    ruleKey: row.rule_key,
    value: row.rule_value,
    confidenceLevel: row.confidence_level,
    sourceId: row.source_id,
    ruleVersionId: row.rule_version_id,
    notes: row.notes ?? null,
    lastReviewedAt: row.last_reviewed_at,
  };
}

export interface LoadRuleBundleOptions {
  /** Restrict loaded rules to these rule_type values. Omit to load all types. */
  ruleTypes?: string[];
  /**
   * Supabase client to query with. Defaults to the shared anon client.
   * API routes should pass the authenticated client from
   * `getSupabaseForRequest(request)` so RLS resolves against the caller's
   * session rather than the (more restricted) anon role.
   */
  client?: SupabaseClient;
}

/**
 * Load a RuleBundle: active rules for the given types, with gaps filled by
 * the latest unverified (inactive) rule_version.
 */
export async function loadRuleBundle(
  options: LoadRuleBundleOptions = {},
): Promise<RuleBundle> {
  const client = options.client ?? defaultAnonClient;
  const ruleTypes = options.ruleTypes;
  const rules = new Map<string, LoadedRule>();

  const { data: activeVersion, error: activeVersionError } = await client
    .from("rule_versions")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  if (activeVersionError) {
    throw new Error(
      `Failed to load active tax rule version: ${activeVersionError.message}`,
    );
  }

  const activeVersionId: string | null = activeVersion?.id ?? null;

  if (activeVersionId) {
    let query = client
      .from("tax_rules")
      .select("*")
      .eq("rule_version_id", activeVersionId);
    if (ruleTypes && ruleTypes.length > 0) {
      query = query.in("rule_type", ruleTypes);
    }
    const { data: activeRules, error: activeRulesError } = await query;
    if (activeRulesError) {
      throw new Error(
        `Failed to load active tax rules: ${activeRulesError.message}`,
      );
    }
    for (const row of activeRules ?? []) {
      rules.set(ruleMapKey(row.rule_type, row.rule_key), toLoadedRule(row));
    }
  }

  const { data: unverifiedVersion, error: unverifiedVersionError } =
    await client
      .from("rule_versions")
      .select("id")
      .eq("is_active", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (unverifiedVersionError) {
    throw new Error(
      `Failed to load unverified tax rule version: ${unverifiedVersionError.message}`,
    );
  }

  const unverifiedVersionId: string | null = unverifiedVersion?.id ?? null;

  if (unverifiedVersionId) {
    let query = client
      .from("tax_rules")
      .select("*")
      .eq("rule_version_id", unverifiedVersionId);
    if (ruleTypes && ruleTypes.length > 0) {
      query = query.in("rule_type", ruleTypes);
    }
    const { data: unverifiedRules, error: unverifiedRulesError } =
      await query;
    if (unverifiedRulesError) {
      throw new Error(
        `Failed to load unverified tax rules: ${unverifiedRulesError.message}`,
      );
    }
    for (const row of unverifiedRules ?? []) {
      const key = ruleMapKey(row.rule_type, row.rule_key);
      if (!rules.has(key)) {
        rules.set(key, toLoadedRule(row));
      }
    }
  }

  return { activeVersionId, unverifiedVersionId, rules };
}

/** Look up a rule; returns undefined if not loaded. */
export function getRule(
  bundle: RuleBundle,
  ruleType: string,
  ruleKey: string,
): LoadedRule | undefined {
  return bundle.rules.get(ruleMapKey(ruleType, ruleKey));
}

/** Return every loaded rule for a given rule_type (e.g. all individual_income_tax brackets). */
export function getRulesByType(
  bundle: RuleBundle,
  ruleType: string,
): LoadedRule[] {
  return Array.from(bundle.rules.values()).filter(
    (rule) => rule.ruleType === ruleType,
  );
}

/** Look up a rule; throws MissingTaxRuleError if not loaded. Never falls back to a default. */
export function requireRule(
  bundle: RuleBundle,
  ruleType: string,
  ruleKey: string,
): LoadedRule {
  const rule = getRule(bundle, ruleType, ruleKey);
  if (!rule) {
    throw new MissingTaxRuleError(ruleType, ruleKey);
  }
  return rule;
}

export interface VatObligationCandidate {
  ruleKey: string;
  thresholdNgn: number;
  assetsThresholdNgn?: number;
  confidenceLevel: string;
  notes: string | null;
  /** Human-readable result of applying ONLY this candidate's rule to the given turnover/assets. */
  resultUnderThisCandidate: string;
}

export type VatObligationStatus =
  | { status: "unresolved"; candidates: VatObligationCandidate[]; reason: string }
  | { status: "no_data"; reason: string };

const VAT_THRESHOLD_CANDIDATE_KEYS: Array<{
  key: string;
  assetsKey?: string;
  kind: "registration_threshold" | "exemption_threshold";
}> = [
  { key: "registration_threshold_legacy_25m", kind: "registration_threshold" },
  {
    key: "small_business_exemption_100m",
    assetsKey: "small_business_exemption_assets_for_100m",
    kind: "exemption_threshold",
  },
  {
    key: "small_business_exemption_50m",
    assetsKey: "small_business_exemption_assets_for_50m",
    kind: "exemption_threshold",
  },
];

/**
 * Determine VAT registration/exemption obligation status from turnover and assets.
 *
 * As of PR 3a there are THREE mutually exclusive unverified candidate
 * thresholds (legacy 25m Finance Act reading, 100m current-seed reading,
 * 50m PwC reading) and no verified figure on the active rule version. This
 * function therefore NEVER asserts a definitive register/exempt outcome —
 * it always returns `unresolved` with every available candidate and what
 * each candidate implies, so UIs can show the conflict instead of a wrong
 * answer. See the review_queue item created by
 * supabase/migrations/20260805140000_tax_rule_provenance_unverified.sql.
 */
export function resolveVatObligationStatus(
  bundle: RuleBundle,
  turnover: number,
  totalAssets: number,
): VatObligationStatus {
  const candidates: VatObligationCandidate[] = [];

  for (const candidate of VAT_THRESHOLD_CANDIDATE_KEYS) {
    const rule = getRule(bundle, "vat", candidate.key);
    if (!rule) continue;

    const thresholdNgn = rule.value.threshold as number;
    const assetsRule = candidate.assetsKey
      ? getRule(bundle, "vat", candidate.assetsKey)
      : undefined;
    const assetsThresholdNgn = assetsRule?.value.threshold as
      | number
      | undefined;

    let resultUnderThisCandidate: string;
    if (candidate.kind === "registration_threshold") {
      resultUnderThisCandidate =
        turnover >= thresholdNgn
          ? "Would require VAT registration under this reading"
          : "Would NOT require VAT registration under this reading";
    } else {
      const turnoverQualifies = turnover < thresholdNgn;
      const assetsQualify =
        assetsThresholdNgn === undefined || totalAssets < assetsThresholdNgn;
      resultUnderThisCandidate =
        turnoverQualifies && assetsQualify
          ? "Would be exempt from VAT under this reading"
          : "Would NOT be exempt from VAT under this reading";
    }

    candidates.push({
      ruleKey: candidate.key,
      thresholdNgn,
      assetsThresholdNgn,
      confidenceLevel: rule.confidenceLevel,
      notes: rule.notes,
      resultUnderThisCandidate,
    });
  }

  if (candidates.length === 0) {
    return {
      status: "no_data",
      reason:
        "No VAT registration/exemption threshold rules are available in the loaded rule bundle.",
    };
  }

  return {
    status: "unresolved",
    candidates,
    reason:
      "Multiple mutually exclusive VAT registration/exemption threshold candidates exist and none is verified against primary legislation. Refusing to assert registration or exemption status until a tax practitioner resolves the conflict (see review_queue).",
  };
}
