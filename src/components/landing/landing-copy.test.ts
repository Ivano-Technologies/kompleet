import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const landing = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
const tokens = [
  readFileSync(resolve(process.cwd(), "tailwind.config.cjs"), "utf8"),
  readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8"),
].join("\n");
const authLayout = readFileSync(
  resolve(process.cwd(), "src/components/layout/AuthLayout.tsx"),
  "utf8",
);
const landingNav = readFileSync(
  resolve(process.cwd(), "src/components/landing/LandingNav.tsx"),
  "utf8",
);
const landingFooter = readFileSync(
  resolve(process.cwd(), "src/components/landing/LandingFooter.tsx"),
  "utf8",
);
const brandWordmark = readFileSync(
  resolve(process.cwd(), "src/components/brand/BrandWordmark.tsx"),
  "utf8",
);
const dashboardSidebar = readFileSync(
  resolve(process.cwd(), "src/components/layout/dashboard/Sidebar.tsx"),
  "utf8",
);
const appSidebar = readFileSync(
  resolve(process.cwd(), "src/app/app/AppSidebar.tsx"),
  "utf8",
);
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
    expect(landing).not.toMatch(/hero-dashboard-crop\.png|hero-dashboard-full\.png/);
  });

  it("wires locked Design illustrations, not invented lifestyle art", () => {
    expect(landing).toMatch(/import-flow\.svg/);
    expect(landing).toMatch(/invoice-nrs\.svg/);
    expect(landing).toMatch(/tax-filing-flow\.svg/);
    expect(authLayout).toMatch(/auth-panel\.svg/);
    expect(authLayout).toMatch(/auth-panel\.png/);
  });

  it("uses Design spot icons, KPI hero crop, and tax-filing-flow — no Demo chrome", () => {
    expect(landing).toMatch(/hero-dashboard-hero-kpis\.png/);
    expect(landing).not.toMatch(/ProductChrome/);
    expect(
      existsSync(
        resolve(process.cwd(), "src/components/landing/ProductChrome.tsx"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "public/assets/illustrations/hero-dashboard-hero-kpis.png",
        ),
      ),
    ).toBe(true);
    for (const spot of [
      "spot-banks",
      "spot-invoice",
      "spot-vat",
      "spot-filing",
      "spot-reports",
      "spot-security",
    ]) {
      expect(landing).toMatch(new RegExp(`${spot}\\.svg`));
      expect(landing).toMatch(new RegExp(`${spot}\\.png`));
      expect(
        existsSync(resolve(process.cwd(), `public/assets/illustrations/${spot}.svg`)),
      ).toBe(true);
      expect(
        existsSync(resolve(process.cwd(), `public/assets/illustrations/${spot}.png`)),
      ).toBe(true);
    }
  });

  it("ships wordmark-only branding with the locked ceoruse face", () => {
    expect(brandWordmark).toMatch(/font-ceoruse/);
    expect(brandWordmark).toMatch(/KOMPLEET/);
    expect(brandWordmark).not.toMatch(/next\/image|logo-primary|logo-inverted|\/logo\.png|squircle/);
    expect(tokens).toMatch(/letter-spacing:\s*0\.08em/);
    expect(tokens).toMatch(/--font-ceoruse/);

    for (const source of [
      landingNav,
      landingFooter,
      authLayout,
      dashboardSidebar,
      appSidebar,
    ]) {
      expect(source).toMatch(/BrandWordmark/);
      expect(source).not.toMatch(
        /logo-primary|logo-inverted|\/logo\.png|logo\.png/,
      );
    }
  });

  it("locks Option C navy + teal and strips lime/amber accents", () => {
    expect(tokens).toMatch(/#0B3A5C/);
    expect(tokens).toMatch(/#0D9488/);
    expect(tokens).toMatch(/#0F766E/);
    expect(tokens).toMatch(/#1B7A4E/);
    expect(tokens).not.toMatch(/#C8F000|#B5D900|#E8A317|#D4920F/);
    expect(landing).not.toMatch(/#C8F000|#E8A317/);
    expect(authLayout).not.toMatch(/#C8F000|#E8A317/);
  });
});
