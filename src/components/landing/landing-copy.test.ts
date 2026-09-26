import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const landing = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
const help = readFileSync(
  resolve(process.cwd(), "src/app/(public)/help/page.tsx"),
  "utf8",
);
const about = readFileSync(
  resolve(process.cwd(), "src/app/(public)/about/page.tsx"),
  "utf8",
);

describe("IVA-72 landing copy", () => {
  it("does not claim Supabase hosting on marketing pages", () => {
    expect(landing).not.toMatch(/Supabase/i);
    expect(help).not.toMatch(/Supabase/i);
    expect(about).not.toMatch(/Supabase/i);
    expect(landing).toMatch(/Hosted on Convex/);
  });

  it("keeps of and your as separate words in the final CTA", () => {
    expect(landing).not.toMatch(/ofYour/);
    expect(landing).toMatch(/of your business finances/);
  });

  it("does not invent social proof on about", () => {
    expect(about).not.toMatch(/thousands of/i);
  });

  it("does not use kill-listed stock assets", () => {
    expect(landing).not.toMatch(/hero-laptop|auth-lifestyle|expense-tracking\.png|invoicing\.png/);
  });
});
