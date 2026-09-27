import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const authLayout = read("src/components/layout/AuthLayout.tsx");
const density = read("src/components/layout/auth-density.ts");
const signup = read("src/app/signup/page.tsx");
const login = read("src/app/login/page.tsx");
const forgot = read("src/app/forgot-password/page.tsx");
const reset = read("src/app/reset-password/ResetPasswordClient.tsx");
const verify = read("src/app/verify-email/page.tsx");

const authPages = [signup, login, forgot, reset, verify];

describe("IVA-90 auth forms fit one desktop screen", () => {
  it("shrinks AuthLayout chrome on desktop (logo, padding, card)", () => {
    expect(authLayout).toMatch(/min-h-dvh/);
    expect(authLayout).toMatch(/size="md"/);
    expect(authLayout).toMatch(/md:p-4/);
    expect(authLayout).toMatch(/md:px-6 md:py-5/);
    expect(authLayout).not.toMatch(/md:p-12/);
    expect(authLayout).not.toMatch(/size="lg"/);
    expect(authLayout).toMatch(/BrandWordmark/);
  });

  it("uses a shared compact field scale instead of 52px inputs", () => {
    expect(density).toMatch(/h-10/);
    expect(density).toMatch(/space-y-3/);
    expect(density).toMatch(/text-\[22px\]/);
    for (const source of authPages) {
      expect(source).not.toMatch(/h-\[52px\]/);
      expect(source).not.toMatch(/text-3xl/);
    }
  });

  it("keeps every signup field and the primary CTA", () => {
    expect(signup).toMatch(/First Name/);
    expect(signup).toMatch(/Last Name/);
    expect(signup).toMatch(/Business Name/);
    expect(signup).toMatch(/Business Email/);
    expect(signup).toMatch(/Password/);
    expect(signup).toMatch(/Create Free Account/);
    expect(signup).toMatch(/Log in/);
  });
});
