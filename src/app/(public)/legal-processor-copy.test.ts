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
const terms = readFileSync(
  resolve(process.cwd(), "src/app/(public)/terms/page.tsx"),
  "utf8",
);

describe("IVA-292 legal processor copy", () => {
  it("does not claim Supabase storage, auth, or cookies", () => {
    expect(privacy).not.toMatch(/Supabase/i);
    expect(cookies).not.toMatch(/Supabase/i);
  });

  it("names the processors from the IVA-224 drafts and no storage jurisdiction", () => {
    const sharing = privacy.slice(
      privacy.indexOf("4. Who we share it with"),
      privacy.indexOf("5. Your rights"),
    );
    for (const processor of [
      "Convex",
      "Vercel",
      "Resend",
      "Sentry",
      "Anthropic",
      "OpenAI",
      "Paystack",
    ]) {
      expect(sharing, processor).toContain(processor);
    }
    expect(sharing).toMatch(/We do not sell personal data/);
    expect(sharing).toMatch(/Some processors store data outside Nigeria/);
    expect(privacy).not.toMatch(/EU \(Ireland\)/);
    expect(privacy).not.toMatch(/Nigerian data residency/);
  });

  it("keeps prices off Privacy and the Cookie Notice", () => {
    for (const page of [privacy, cookies]) {
      expect(page).not.toMatch(/\u20a6|NGN|\bnaira\b/i);
    }
  });

  it("uses a single Last updated line of 13 November 2026 with no Effective date", () => {
    for (const page of [privacy, cookies, terms]) {
      expect(page).toMatch(/Last updated: 13 November 2026\n/);
      expect(page).not.toMatch(/Last updated: February/);
      expect(page).not.toMatch(/Effective date:/i);
      expect(page).not.toMatch(/set on the day of publication/);
    }
  });

  it("does not claim Google OAuth or Sign in with Google", () => {
    expect(privacy).not.toMatch(/Google OAuth/i);
    expect(privacy).not.toMatch(/Sign in with Google/i);
    expect(terms).not.toMatch(/Google OAuth/i);
    expect(terms).not.toMatch(/Sign in with Google/i);
  });

  it("keeps the Cookie Notice without a theme toggle", () => {
    expect(cookies).not.toMatch(/light\/dark/i);
    expect(cookies).not.toMatch(/dark mode/i);
  });
});
