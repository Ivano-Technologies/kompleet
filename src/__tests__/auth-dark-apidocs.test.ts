import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const authLayout = read("src/components/layout/AuthLayout.tsx");
const density = read("src/components/layout/auth-density.ts");
const apiDocs = read("src/app/(public)/api-docs/page.tsx");

describe("auth dark mode contrast", () => {
  it("gives the auth card a real dark surface, border and wordmark", () => {
    expect(authLayout).toMatch(/dark:bg-dark-bg/);
    expect(authLayout).toMatch(/dark:bg-dark-surface/);
    expect(authLayout).toMatch(/dark:border-dark-border/);
    expect(authLayout).toMatch(/dark:text-dark-text-1/);
  });

  it("keeps auth copy off the sub-4.5:1 text-4 tokens", () => {
    expect(density).not.toMatch(/text-text-4/);
    expect(density).not.toMatch(/dark:text-dark-text-4/);
  });

  it("uses a CTA fill that clears 4.5:1 with white text", () => {
    expect(density).toMatch(/AUTH_SUBMIT =\s*"[^"]*bg-accent-hover/);
    expect(density).toMatch(/AUTH_LINK =\s*"[^"]*dark:text-teal-400/);
  });
});

describe("api-docs", () => {
  it("documents the production API base URL", () => {
    expect(apiDocs).toMatch(/https:\/\/kompleet\.techivano\.com\/api/);
    expect(apiDocs).not.toMatch(/vercel\.app/);
  });

  it("gives Back to Home a dark-mode colour", () => {
    expect(apiDocs).toMatch(/Back to Home/);
    expect(apiDocs).toMatch(/text-primary hover:underline dark:text-teal-400/);
  });
});
