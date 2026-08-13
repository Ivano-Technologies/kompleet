/**
 * Tax Rule Errors
 * ===============
 * Thrown when a computation needs a rate/threshold that has not been loaded
 * into the RuleBundle. Callers must NEVER catch this and substitute a
 * hardcoded value — the correct response is to surface the error to the
 * user (disable the calculation, show a clear message) until the rule is
 * seeded and reviewed. See docs/TAX_RULE_PROVENANCE.md.
 */
export class MissingTaxRuleError extends Error {
  readonly ruleType: string;
  readonly ruleKey: string;

  constructor(ruleType: string, ruleKey: string, detail?: string) {
    super(
      `Missing tax rule "${ruleType}.${ruleKey}"${detail ? `: ${detail}` : ""}. ` +
        "This figure has not been verified/seeded in the tax_rules table for the active " +
        "(or unverified-candidate) rule version — refusing to fall back to a hardcoded rate.",
    );
    this.name = "MissingTaxRuleError";
    this.ruleType = ruleType;
    this.ruleKey = ruleKey;
  }
}
