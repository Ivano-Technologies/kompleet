import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const privacy = readFileSync(
  resolve(process.cwd(), "src/app/(public)/privacy/page.tsx"),
  "utf8",
);
const cookies = readFileSync(
  resolve(process.cwd(), "src/app/(public)/cookies/page.tsx"),
  "utf8",
);

describe("IVA-292 legal processor copy", () => {
  it("does not claim Supabase storage, auth, or cookies", () => {
    expect(privacy).not.toMatch(/Supabase/i);
    expect(cookies).not.toMatch(/Supabase/i);
  });

  it("does not invent a replacement processor or storage jurisdiction", () => {
    expect(privacy).not.toMatch(/Convex/i);
    expect(cookies).not.toMatch(/Convex/i);
    expect(privacy).not.toMatch(/EU \(Ireland\)/);
  });

  it("keeps the no Nigerian residency disclaimer and the OCR processor clause", () => {
    expect(privacy).toMatch(/We do not claim Nigerian data residency/);
    expect(privacy).toMatch(/third-party OCR and document processing/);
  });

  it("sets Last updated to 10 November 2026 and keeps original Effective dates", () => {
    expect(privacy).toMatch(
      /Last updated: 10 November 2026\. Effective date: February 25, 2026\./,
    );
    expect(privacy).not.toMatch(/Last updated: February/);
    expect(cookies).toMatch(/Last updated: 10 November 2026/);
    expect(cookies).not.toMatch(/Last updated: February/);
    expect(cookies).not.toMatch(/Effective date:/);
  });
});
