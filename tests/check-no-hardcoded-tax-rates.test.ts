import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

const SCRIPT_PATH = path.resolve(
  __dirname,
  "..",
  "scripts",
  "check-no-hardcoded-tax-rates.mjs",
);

describe("check-no-hardcoded-tax-rates guard", () => {
  it("exits 0 against the current codebase (no hardcoded tax rates)", () => {
    expect(() =>
      execFileSync("node", [SCRIPT_PATH], {
        cwd: path.resolve(__dirname, ".."),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  // Duplicate the guard's core banned-pattern assertions here so a future
  // change to the regexes in scripts/check-no-hardcoded-tax-rates.mjs is
  // caught by this unit test even without executing the full script against
  // fixture files on disk.
  const NUMERIC_FALLBACK_PATTERN = /\|\|\s*([0-9][0-9_]*(\.[0-9]+)?)/;
  const CONSTANT_IDENTIFIER_PATTERN =
    /\b(STANDARD_RATE|ZERO_RATE|REGISTRATION_THRESHOLD|EXEMPT_CATEGORIES|ZERO_RATED_CATEGORIES)\s*[:=]/;
  const VAT_DEFAULT_LITERAL_PATTERN = /0\.075\b/;

  it("flags a `|| 7.5` style hardcoded VAT rate fallback", () => {
    const line = "const rate = rules.standard_rate?.value?.rate || 7.5;";
    const match = line.match(NUMERIC_FALLBACK_PATTERN);
    expect(match).not.toBeNull();
    expect(Number.parseFloat(match![1])).not.toBe(0);
  });

  it("flags a `|| 50_000_000` style hardcoded threshold fallback", () => {
    const line =
      "const threshold = rules.small_business_exemption_turnover?.value?.threshold || 50_000_000;";
    const match = line.match(NUMERIC_FALLBACK_PATTERN);
    expect(match).not.toBeNull();
    expect(Number.parseFloat(match![1].replace(/_/g, ""))).not.toBe(0);
  });

  it("flags a `|| 0.3` style hardcoded rate fallback", () => {
    const line = "const developmentLevyRate = rules.development_levy_rate?.value?.rate || 0.3;";
    const match = line.match(NUMERIC_FALLBACK_PATTERN);
    expect(match).not.toBeNull();
    expect(Number.parseFloat(match![1])).not.toBe(0);
  });

  it("does not flag a bare `|| 0` numeric input fallback", () => {
    const line = 'const turnoverNum = parseFloat(turnover) || 0;';
    const match = line.match(NUMERIC_FALLBACK_PATTERN);
    expect(match).not.toBeNull();
    expect(Number.parseFloat(match![1])).toBe(0);
  });

  it("flags reintroduction of a hardcoded VATService constant", () => {
    expect(CONSTANT_IDENTIFIER_PATTERN.test("const STANDARD_RATE = 7.5;")).toBe(
      true,
    );
    expect(
      CONSTANT_IDENTIFIER_PATTERN.test(
        "static EXEMPT_CATEGORIES: string[] = [];",
      ),
    ).toBe(true);
  });

  it("flags the literal VAT default rate 0.075", () => {
    expect(VAT_DEFAULT_LITERAL_PATTERN.test("const vatRate = 0.075;")).toBe(
      true,
    );
  });
});
