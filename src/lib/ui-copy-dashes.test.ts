import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const DASH = /[\u2013\u2014]/;

function listCopyModules(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith("-copy.ts") || name === "invoice-copy.ts")
    .map((name) => join(dir, name));
}

describe("IVA-191 user-facing copy has no em or en dashes", () => {
  const roots = [
    resolve(process.cwd(), "src/components"),
    resolve(process.cwd(), "src/lib"),
  ];

  const files = [
    ...listCopyModules(resolve(process.cwd(), "src/components/import")),
    ...listCopyModules(resolve(process.cwd(), "src/components/invoices")),
    ...listCopyModules(resolve(process.cwd(), "src/components/review")),
    ...listCopyModules(resolve(process.cwd(), "src/components/settings")),
    ...listCopyModules(resolve(process.cwd(), "src/components/tax")),
    ...listCopyModules(resolve(process.cwd(), "src/components/dashboard")),
    ...listCopyModules(resolve(process.cwd(), "src/components/documents")),
    resolve(process.cwd(), "src/lib/friendly-error.ts"),
    resolve(process.cwd(), "src/components/tax/tax-copy.ts"),
  ];

  it("keeps copy modules and friendly messages free of em and en dashes", () => {
    expect(roots.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(DASH);
    }
  });

  it("writes tax period ranges as Jan to Mar", () => {
    const tax = readFileSync(
      resolve(process.cwd(), "src/components/tax/tax-copy.ts"),
      "utf8",
    );
    expect(tax).toMatch(/Jan to Mar/);
    expect(tax).toMatch(/Apr to Jun/);
    expect(tax).not.toMatch(/Jan[\u2013\u2014-]Mar/);
  });
});
