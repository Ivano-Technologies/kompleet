import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const SERVICE_PATH = path.join(
  ROOT,
  "src",
  "lib",
  "services",
  "tax-computation-service.ts",
);
const SEED_PATH = path.join(ROOT, "populate_tax_rules.sql");

function extractCodeKeys(source: string): string[] {
  const keys = new Set<string>();
  const requireRe = /\.require\(\s*"([a-z_]+)"\s*,\s*"([^"]+)"\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = requireRe.exec(source)) !== null) {
    keys.add(`${match[1]}.${match[2]}`);
  }

  if (source.includes('startsWith("tax_bracket_")')) {
    for (let i = 1; i <= 6; i += 1) {
      keys.add(`individual_income_tax.tax_bracket_${i}`);
    }
  }

  return [...keys].sort();
}

function extractSeedKeys(sql: string): Set<string> {
  const keys = new Set<string>();
  const re =
    /'(individual_income_tax|business_tax|vat|stamp_duty|capital_allowance|development_levy|property_tax)',\s*'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(sql)) !== null) {
    keys.add(`${match[1]}.${match[2]}`);
  }
  return keys;
}

describe("populate_tax_rules.sql covers keys the tax engine reads", () => {
  it("contains every rule key TaxComputationService.require reads", () => {
    const source = readFileSync(SERVICE_PATH, "utf8");
    const sql = readFileSync(SEED_PATH, "utf8");
    const codeKeys = extractCodeKeys(source);
    const seedKeys = extractSeedKeys(sql);

    expect(codeKeys.length).toBeGreaterThan(0);
    expect(seedKeys.has("business_tax.minimum_etr")).toBe(true);
    expect(seedKeys.has("business_tax.very_large_turnover_threshold")).toBe(
      true,
    );
    expect(sql).not.toMatch(/minimum_effective_tax_rate/);

    const missing = codeKeys.filter((key) => !seedKeys.has(key));
    expect(missing).toEqual([]);
  });
});
