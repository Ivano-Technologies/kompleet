import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const landing = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
const heroAuthCard = readFileSync(
  resolve(process.cwd(), "src/components/landing/HeroAuthCard.tsx"),
  "utf8",
);
const heroAuth = readFileSync(
  resolve(process.cwd(), "src/components/landing/hero-auth.ts"),
  "utf8",
);
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
const rootLayout = readFileSync(
  resolve(process.cwd(), "src/app/layout.tsx"),
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
    expect(landing).not.toMatch(/hero-dashboard-crop\.png|hero-dashboard-full\.png|hero-dashboard-hero-kpis\.png/);
  });

  it("wires locked Design illustrations, not invented lifestyle art", () => {
    expect(landing).toMatch(/tax-filing-flow\.svg/);
    expect(authLayout).toMatch(/auth-panel\.svg/);
    expect(authLayout).toMatch(/auth-panel\.png/);
  });

  it("removes the Product Proof band from the homepage", () => {
    expect(landing).not.toMatch(/Product proof/i);
    expect(landing).not.toMatch(/Real tooling, labeled demo data/);
    expect(landing).not.toMatch(/productProof/);
    expect(landing).not.toMatch(/import-flow\.(svg|png)/);
    expect(landing).not.toMatch(/invoice-nrs\.(svg|png)/);
    expect(landing).not.toMatch(/Tax centre/);
    expect(
      existsSync(
        resolve(process.cwd(), "public/assets/illustrations/import-flow.svg"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(process.cwd(), "public/assets/illustrations/import-flow.png"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(process.cwd(), "public/assets/illustrations/invoice-nrs.svg"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(process.cwd(), "public/assets/illustrations/invoice-nrs.png"),
      ),
    ).toBe(false);
  });

  it("keeps the hero compact so auth fits above the fold", () => {
    const hero = landing.slice(
      landing.indexOf("<header>"),
      landing.indexOf("</header>"),
    );
    expect(hero).toMatch(/lg:h-\[calc\(100svh-4rem\)\]/);
    expect(hero).toMatch(/py-6/);
    expect(hero).toMatch(/lg:py-8/);
    expect(hero).toMatch(/text-\[32px\]/);
    expect(hero).toMatch(/xl:text-\[40px\]/);
    expect(hero).not.toMatch(/text-5xl/);
    expect(hero).not.toMatch(/py-16|lg:py-24|lg:min-h-\[640px\]/);
    expect(hero).toMatch(/Nigerian bank imports, Tax Act 2025, and NRS-ready invoices/);
    expect(heroAuthCard).toMatch(/p-4 shadow-2/);
    expect(heroAuthCard).toMatch(/h-11/);
    expect(heroAuthCard).not.toMatch(/h-\[52px\]/);
  });

  it("uses Design spot icons, ledger hero illustration, and tax-filing-flow — no Demo chrome", () => {
    expect(landing).toMatch(/hero-kompleet\.svg/);
    expect(landing).toMatch(/hero-kompleet\.png/);
    expect(landing).toMatch(/<picture>/);
    expect(landing).not.toMatch(/screenshot/i);
    expect(landing).not.toMatch(/ProductChrome/);
    expect(landing).not.toMatch(/hero-dashboard/);
    expect(
      existsSync(
        resolve(process.cwd(), "src/components/landing/ProductChrome.tsx"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "public/assets/illustrations/hero-kompleet.svg",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "public/assets/illustrations/hero-kompleet.png",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "public/assets/illustrations/hero-dashboard-hero-kpis.png",
        ),
      ),
    ).toBe(false);
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
    expect(brandWordmark).not.toMatch(/font-display|font-sans|next\/image|logo-primary|logo-inverted|\/logo\.png/);
    expect(brandWordmark).not.toMatch(/className=\{cn\(\s*"font-(display|sans)/);
    expect(tokens).toMatch(/letter-spacing:\s*0\.08em/);
    expect(tokens).toMatch(/--font-ceoruse/);
    expect(tokens).toMatch(/\.font-ceoruse[\s\S]*var\(--font-ceoruse\)/);

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

  it("locks Ceoruse wordmark, Clash headlines, and Montserrat body", () => {
    expect(rootLayout).toMatch(/import \{ Montserrat \} from "next\/font\/google"/);
    expect(rootLayout).toMatch(/--font-montserrat/);
    expect(rootLayout).toMatch(/font-body/);
    expect(rootLayout).not.toMatch(/\bInter\b/);
    expect(tokens).toMatch(/Montserrat/);
    expect(tokens).toMatch(/--font-montserrat/);
    expect(tokens).toMatch(/Clash Display/);
    expect(tokens).not.toMatch(/["']Inter["']/);
    expect(tokens).not.toMatch(/--font-inter/);
    expect(landing).toMatch(/font-display/);
    expect(brandWordmark).toMatch(/font-ceoruse/);
    expect(brandWordmark).not.toMatch(/font-body|Montserrat/);
  });

  it("wires a split hero: auth card left, locked ledger right", () => {
    expect(landing).toMatch(/<LandingNav heroAuth/);
    expect(landing).toMatch(/HeroAuthCard/);
    expect(landing).toMatch(/lg:grid-cols-\[minmax\(0,46fr\)_minmax\(0,54fr\)\]/);
    expect(landing).toMatch(/bg-primary-deep/);
    expect(landing).toMatch(/hero-kompleet\.svg/);
    expect(landing).toMatch(/hero-kompleet\.png/);
    expect(landing).not.toMatch(/Continue with Google|google/i);
    expect(heroAuthCard).not.toMatch(/Continue with Google|signIn\("google"/);
    expect(heroAuthCard).toMatch(/Get started/);
    expect(heroAuthCard).toMatch(/Sign in/);
    expect(heroAuthCard).toMatch(/type="email"/);
    expect(heroAuthCard).toMatch(/type=\{showPassword \? "text" : "password"\}/);
    expect(heroAuthCard).toMatch(/flow: mode === "signup" \? "signUp" : "signIn"/);
    expect(heroAuthCard).toMatch(/border-border bg-surface/);
    expect(heroAuthCard).toMatch(/shadow-2/);
    expect(heroAuthCard).toMatch(/bg-accent[\s\S]*text-white/);
    expect(heroAuthCard).not.toMatch(/shadow-primary|teal glow|shadow-accent/);
    expect(heroAuthCard).toMatch(/text-primary/);
    expect(heroAuth).toMatch(/HERO_AUTH_ID/);
    expect(landingNav).toMatch(/heroAuth/);
    expect(landingNav).toMatch(/requestHeroAuth/);
    expect(landingNav).toMatch(/#\$\{HERO_AUTH_ID\}/);
  });

  it("ships Kezie locked teal naira favicon sitewide", () => {
    expect(rootLayout).toMatch(/url: "\/favicon\.svg", type: "image\/svg\+xml"/);
    expect(rootLayout).toMatch(/url: "\/favicon-32\.png", sizes: "32x32"/);
    expect(rootLayout).toMatch(/url: "\/favicon-16\.png", sizes: "16x16"/);
    expect(rootLayout).toMatch(/url: "\/apple-touch-180\.png"/);
    expect(rootLayout).toMatch(/themeColor: "#0D9488"/);
    expect(rootLayout).toMatch(/<meta name="theme-color" content="#0D9488" \/>/);
    expect(rootLayout).toMatch(
      /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml" \/>/,
    );
    expect(rootLayout).not.toMatch(/\/favicon\.png/);
    expect(rootLayout).not.toMatch(/#C8F000|#E8A317/);
    expect(rootLayout).not.toMatch(/#0B3A5C/);

    const faviconSvg = readFileSync(
      resolve(process.cwd(), "public/favicon.svg"),
      "utf8",
    );
    expect(faviconSvg).toMatch(/#0D9488/);
    expect(faviconSvg).toMatch(/#FFFFFF|#FFF\b/i);
    expect(faviconSvg).not.toMatch(/#0B3A5C|#C8F000|#E8A317/);
    expect(faviconSvg).not.toMatch(/>\s*K\s*</);

    for (const file of [
      "public/favicon.svg",
      "public/favicon-32.png",
      "public/favicon-16.png",
      "public/apple-touch-180.png",
    ]) {
      expect(existsSync(resolve(process.cwd(), file))).toBe(true);
    }
    expect(existsSync(resolve(process.cwd(), "public/favicon.png"))).toBe(false);
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
