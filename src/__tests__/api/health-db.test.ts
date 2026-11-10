/** @vitest-environment node */

import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Supabase keep-alive removed", () => {
  it("does not ship GET /api/health/db", () => {
    expect(
      existsSync(path.join(process.cwd(), "src/app/api/health/db/route.ts")),
    ).toBe(false);
  });

  it("does not ship the Supabase keepalive GitHub workflow", () => {
    expect(
      existsSync(path.join(process.cwd(), ".github/workflows/keepalive.yml")),
    ).toBe(false);
  });
});
