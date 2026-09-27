import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const authLayout = read("src/components/layout/AuthLayout.tsx");
const density = read("src/components/layout/auth-density.ts");
const globals = read("src/app/globals.css");
const signup = read("src/app/signup/page.tsx");
const login = read("src/app/login/page.tsx");
const forgot = read("src/app/forgot-password/page.tsx");
const reset = read("src/app/reset-password/ResetPasswordClient.tsx");
const verify = read("src/app/verify-email/page.tsx");
const heroAuth = read("src/components/landing/HeroAuthCard.tsx");

const authPages = [signup, login, forgot, reset, verify];

describe("IVA-90 AUTH-DENSITY lock", () => {
  it("locks AuthLayout card, page gutter, and wordmark", () => {
    expect(authLayout).toMatch(/min-h-dvh/);
    expect(authLayout).toMatch(/max-w-\[440px\]/);
    expect(authLayout).toMatch(/p-5 shadow-1 md:p-6/);
    expect(authLayout).toMatch(/px-4 py-4 md:w-1\/2 md:px-6 md:py-5/);
    expect(authLayout).toMatch(/mb-3 flex justify-center/);
    expect(authLayout).toMatch(/size="md"/);
    expect(authLayout).not.toMatch(/md:p-12/);
    expect(authLayout).not.toMatch(/size="lg"/);
    expect(authLayout).toMatch(/BrandWordmark/);
  });

  it("locks shared field tokens to h-11, space-y-3, Clash 26", () => {
    expect(density).toMatch(/h-11/);
    expect(density).not.toMatch(/h-10/);
    expect(density).toMatch(/space-y-3/);
    expect(density).toMatch(/text-\[26px\]/);
    expect(density).toMatch(/mt-1 h-11/);
    expect(globals).toMatch(/max-height:\s*800px/);
    expect(globals).toMatch(/\.auth-sub/);
    for (const source of authPages) {
      expect(source).not.toMatch(/h-\[52px\]/);
      expect(source).not.toMatch(/text-3xl/);
    }
  });

  it("keeps every signup field, CTA, and locked header order", () => {
    expect(signup).toMatch(/headerRightAddon/);
    expect(signup).toMatch(/Already have an account/);
    expect(signup).toMatch(/First Name/);
    expect(signup).toMatch(/Last Name/);
    expect(signup).toMatch(/Business Name/);
    expect(signup).toMatch(/Business Email/);
    expect(signup).toMatch(/Password/);
    expect(signup).toMatch(/Create Free Account/);
    expect(signup).toMatch(/AUTH_TRUST/);
    expect(signup).toMatch(/NDPR Compliant/);
  });

  it("does not change homepage hero auth density", () => {
    expect(heroAuth).toMatch(/h-11/);
    expect(heroAuth).toMatch(/Get started/);
    expect(heroAuth).toMatch(/Sign in/);
  });
});
