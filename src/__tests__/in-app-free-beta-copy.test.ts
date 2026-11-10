import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["src", "apps/mobile", "e2e"];
const SOURCE = /\.(ts|tsx|js|jsx)$/;
const TEST_FILE = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
const FORBIDDEN =
  /Free Beta|free beta|Free during beta|during beta|Beta access|After beta/i;

function walk(dir: string, acc: string[]): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, acc);
    } else if (SOURCE.test(name) && !TEST_FILE.test(name)) {
      acc.push(path);
    }
  }
  return acc;
}

describe("IVA-293 in-app Free Beta copy", () => {
  it("has no Free Beta or during-beta wording in app, dormant, or e2e UI sources", () => {
    const files = ROOTS.flatMap((root) => walk(root, []));
    const hits = files.filter((file) => FORBIDDEN.test(readFileSync(file, "utf8")));
    expect(hits).toEqual([]);
  });
});
