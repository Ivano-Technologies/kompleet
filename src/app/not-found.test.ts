import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("expected HTTP error pages", () => {
  it("does not show a support Ref on 404, 401, or 403", () => {
    for (const file of [
      "src/app/not-found.tsx",
      "src/app/401/page.tsx",
      "src/app/403/page.tsx",
    ]) {
      const source = read(file);
      expect(source).not.toMatch(/ErrorRef|generateRef|Ref:/);
    }
  });

  it("keeps a support Ref on unexpected error boundaries", () => {
    expect(read("src/app/error.tsx")).toMatch(/ErrorRef/);
    expect(read("src/app/(dashboard)/error.tsx")).toMatch(/ErrorRef/);
  });
});
