#!/usr/bin/env node
/**
 * Hardcoded tax rate guard — KOMPLEET (PR 3a rate consolidation)
 *
 * Every tax rate, threshold, and bracket must be traceable to a dated, cited,
 * human-verified row in the `tax_rules` table (see docs/TAX_RULE_PROVENANCE.md).
 * This script scans the tax service layer and calculator pages for patterns
 * that indicate a hardcoded fallback has crept back in, and fails the build
 * if any are found.
 *
 * Scanned paths:
 *   - src/lib/services/vat*.ts (excluding *.test.ts)
 *   - src/lib/services/tax-computation*.ts (excluding *.test.ts)
 *   - src/app/(dashboard)/calculators/**\/page.tsx
 *
 * Banned patterns:
 *   1. Named constants that used to hold hardcoded tax figures
 *      (STANDARD_RATE, ZERO_RATE, REGISTRATION_THRESHOLD, EXEMPT_CATEGORIES,
 *      ZERO_RATED_CATEGORIES) declared as a bare identifier.
 *   2. `|| <number>` fallback expressions — the classic "use the rule value
 *      or fall back to a hardcoded default" pattern (e.g. `|| 7.5`,
 *      `|| 50_000_000`, `|| 0.3`).
 *   3. The literal VAT default rate 0.075 (7.5% as a decimal) anywhere in
 *      scanned files.
 *
 * Exit codes:
 *   0 — no banned patterns found
 *   1 — one or more banned patterns found
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** @type {{ label: string, pattern: RegExp, isViolation?: (match: RegExpMatchArray) => boolean }[]} */
const BANNED_PATTERNS = [
  {
    label: "hardcoded VAT/business-tax constant identifier",
    pattern:
      /\b(STANDARD_RATE|ZERO_RATE|REGISTRATION_THRESHOLD|EXEMPT_CATEGORIES|ZERO_RATED_CATEGORIES)\s*[:=]/,
  },
  {
    label: "numeric `||` fallback (hardcoded default rate/threshold)",
    // Matches `|| <number>` but ignores a bare zero fallback (e.g.
    // `parseFloat(x) || 0`), which is a standard "treat blank input as
    // zero" idiom, not a hardcoded tax rate/threshold.
    pattern: /\|\|\s*([0-9][0-9_]*(\.[0-9]+)?)/,
    isViolation: (match) => Number.parseFloat(match[1].replace(/_/g, "")) !== 0,
  },
  {
    label: "literal VAT default rate 0.075 (7.5%)",
    pattern: /0\.075\b/,
  },
];

/**
 * Lines that are allowed to contain what would otherwise look like a banned
 * pattern. Kept intentionally small — prefer fixing the code over widening
 * this list.
 */
const ALLOWLIST_SUBSTRINGS = [
  // Calendar month wraparound for a filing-deadline date string — not a tax
  // rate or threshold.
  "deadlineMonth % 12 || 12",
];

function isAllowlisted(line) {
  const trimmed = line.trim();
  // Comments can't execute, so a rate mentioned in a JSDoc example (e.g.
  // "rate (e.g. 0.075 for 7.5%)") is documentation, not a hardcoded default.
  if (trimmed.startsWith("*") || trimmed.startsWith("//")) return true;
  return ALLOWLIST_SUBSTRINGS.some((s) => line.includes(s));
}

function walk(dir, matcher, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, matcher, out);
    } else if (matcher(full)) {
      out.push(full);
    }
  }
  return out;
}

function collectTargetFiles() {
  const files = [];

  // src/lib/services/{vat,tax-computation}*.ts (excluding *.test.ts)
  const servicesDir = path.join(ROOT, "src", "lib", "services");
  if (fs.existsSync(servicesDir)) {
    for (const entry of fs.readdirSync(servicesDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const name = entry.name;
      const isTarget =
        (name.startsWith("vat") || name.startsWith("tax-computation")) &&
        name.endsWith(".ts") &&
        !name.endsWith(".test.ts");
      if (isTarget) files.push(path.join(servicesDir, name));
    }
  }

  // src/app/(dashboard)/calculators/**/page.tsx
  const calculatorsDir = path.join(
    ROOT,
    "src",
    "app",
    "(dashboard)",
    "calculators",
  );
  walk(calculatorsDir, (f) => f.endsWith("page.tsx"), files);

  return files;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const violations = [];

  lines.forEach((line, idx) => {
    if (isAllowlisted(line)) return;
    for (const { label, pattern, isViolation } of BANNED_PATTERNS) {
      const match = line.match(pattern);
      if (match && (!isViolation || isViolation(match))) {
        violations.push({
          line: idx + 1,
          label,
          text: line.trim(),
        });
      }
    }
  });

  return violations;
}

function main() {
  const files = collectTargetFiles();

  if (files.length === 0) {
    console.error(
      "❌ No target files found — check that src/lib/services and the calculators directory exist.",
    );
    process.exit(1);
  }

  let totalViolations = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const violations = scanFile(file);
    if (violations.length === 0) continue;

    totalViolations += violations.length;
    console.error(`\n❌ ${rel}`);
    for (const v of violations) {
      console.error(`   L${v.line} [${v.label}]: ${v.text}`);
    }
  }

  console.log(`\nScanned ${files.length} file(s) for hardcoded tax rates.`);

  if (totalViolations > 0) {
    console.error(
      `\n❌ Found ${totalViolations} hardcoded tax rate pattern(s). All tax rates/thresholds must come from the tax_rules database via RuleBundle — see docs/TAX_RULE_PROVENANCE.md.`,
    );
    process.exit(1);
  }

  console.log(
    "✅ No hardcoded tax rate patterns found — all figures are rule-driven.",
  );
  process.exit(0);
}

main();
