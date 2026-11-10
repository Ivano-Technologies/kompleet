import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(process.cwd(), "src/app/(dashboard)/categories/page.tsx"),
  "utf8",
);

describe("/categories Edit affordance", () => {
  it("does not promise auto-categorisation keywords on the subheading", () => {
    expect(source).toContain("Manage transaction categories used to organise your books");
    expect(source).toContain("Transaction categories used to organise your books");
    expect(source).not.toMatch(/keywords used for auto-categorization/i);
    expect(source).not.toMatch(/keywords for auto-categorization/i);
  });

  it("gates Edit behind admin:manage_rules so non-admins never see it", () => {
    expect(source).toContain('hasPermission(role, "admin:manage_rules")');
    expect(source).toContain("canEditCategories");
    expect(source).toMatch(/canEditCategories && \(\s*<button[\s\S]*Edit/);
    expect(source).toContain("if (!canEditCategories || !editingId) return");
  });
});
