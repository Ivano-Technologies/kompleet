import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const landing = read("src/app/page.tsx");
const pricing = read("src/app/(public)/pricing/page.tsx");
const signup = read("src/app/signup/page.tsx");
const privacy = read("src/app/(public)/privacy/page.tsx");
const footer = read("src/components/landing/LandingFooter.tsx");
const nav = read("src/components/landing/LandingNav.tsx");
const globals = read("src/app/globals.css");
const hero = read("src/components/landing/HeroAuthCard.tsx");

describe("IVA-290 marketing accessibility", () => {
  it("exposes main landmarks and a skip link on the four pages", () => {
    expect(landing).toMatch(/id="main-content"/);
    expect(pricing).toMatch(/id="main-content"/);
    expect(privacy).toMatch(/id="main-content"/);
    expect(nav).toMatch(/SkipToContent/);
    expect(privacy).toMatch(/SkipToContent/);
    expect(signup).toMatch(/AuthLayout/);
  });

  it("keeps heading order without skipping to h4", () => {
    expect(footer).not.toMatch(/<h4\b/);
    expect(footer).toMatch(/<h2 className="mb-4 text-sm font-semibold/);
    expect(landing).not.toMatch(/<header>/);
  });

  it("names the signup password toggle and ties labels to inputs", () => {
    expect(signup).toMatch(/htmlFor="signup-first-name"/);
    expect(signup).toMatch(/id="signup-password"/);
    expect(signup).toMatch(/aria-label=\{showPassword \? "Hide password" : "Show password"\}/);
    expect(signup).toMatch(/id="signup-error"/);
    expect(signup).toMatch(/aria-describedby=\{error \? "signup-error" : undefined\}/);
  });

  it("underlines privacy links and uses AA accent fills", () => {
    expect(privacy).toMatch(/underline underline-offset-2/);
    expect(privacy).not.toMatch(/hover:underline/);
    expect(hero).toMatch(/bg-accent-hover/);
    expect(landing).toMatch(/bg-accent-hover/);
    expect(pricing).toMatch(/bg-accent-hover/);
  });

  it("keeps a visible focus ring and reduced motion", () => {
    expect(globals).toMatch(/\*:focus-visible/);
    expect(globals).toMatch(/prefers-reduced-motion: reduce/);
    expect(globals).toMatch(/\.skip-to-content:focus/);
  });
});
