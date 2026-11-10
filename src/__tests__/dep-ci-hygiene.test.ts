import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("dependency and CI hygiene", () => {
  it("keeps gitleaks on every PR and CodeQL on PRs into dev", () => {
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toMatch(/secret_scan:/);
    expect(ci).toMatch(/gitleaks detect/);
    expect(ci).toMatch(/node scripts\/audit-ci\.mjs/);
    const codeql = read(".github/workflows/codeql.yml");
    expect(codeql).toMatch(/branches: \["main", "dev"\]/);
    expect(codeql).toMatch(/javascript-typescript/);
  });

  it("sends Dependabot security updates to dev, not main", () => {
    const dependabot = read(".github/dependabot.yml");
    expect(dependabot).toMatch(/target-branch: "dev"/);
    expect(dependabot).toMatch(/open-pull-requests-limit: 0/);
    expect(dependabot).toMatch(/applies-to: security-updates/);
  });
});
