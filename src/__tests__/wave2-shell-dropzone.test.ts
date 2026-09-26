import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const sidebar = read("src/components/layout/dashboard/Sidebar.tsx");
const nav = read("src/components/layout/dashboard/nav-config.ts");
const dropZone = read("src/components/import/StatementDropZone.tsx");
const copy = read("src/components/import/statement-copy.ts");
const dashboard = read("src/app/(dashboard)/dashboard/DashboardClient.tsx");
const taxHub = read("src/app/(dashboard)/tax/page.tsx");
const nextConfig = read("next.config.mjs");
const appPage = read("src/app/app/page.tsx");
const shell = read("src/components/layout/dashboard/DashboardShell.tsx");
const bottomNav = read("src/components/layout/dashboard/BottomNav.tsx");
const topBar = read("src/components/layout/dashboard/TopBar.tsx");

describe("IVA-80 app shell / nav IA", () => {
  it("locks primary destinations to Dashboard, Books, Invoices, Tax, More, Settings", () => {
    expect(nav).toMatch(/label: "Dashboard"/);
    expect(nav).toMatch(/label: "Books"/);
    expect(nav).toMatch(/href: "\/transactions"/);
    expect(nav).toMatch(/label: "Invoices"/);
    expect(nav).toMatch(/href: "\/tax"/);
    expect(nav).toMatch(/label: "Tax"/);
    expect(sidebar).toMatch(/>More</);
    expect(sidebar).toMatch(/>Settings</);
    expect(sidebar).not.toMatch(/label: "Transactions"/);
  });

  it("demotes Upload, Review, Duplicates, Reports tree, and calculator children", () => {
    expect(sidebar).not.toMatch("/transactions/upload");
    expect(sidebar).not.toMatch("/transactions/review");
    expect(sidebar).not.toMatch("/transactions/duplicates");
    expect(sidebar).not.toMatch("Compliance Reports");
    expect(sidebar).not.toMatch("/calculators/business-tax");
    expect(nav).not.toMatch("/transactions/upload");
  });

  it("puts secondary destinations in More", () => {
    for (const href of [
      "/expenses",
      "/export",
      "/reports/profit-loss",
      "/reports/balance-sheet",
      "/reports/cash-flow",
      "/categories",
      "/calculators",
      "/history",
      "/yoy-comparison",
      "/profile",
    ]) {
      expect(nav).toContain(`href: "${href}"`);
    }
  });

  it("keeps wordmark-only branding and teal active tokens", () => {
    expect(sidebar).toMatch(/BrandWordmark/);
    expect(sidebar).not.toMatch(/logo\.png|next\/image/);
    expect(sidebar).toMatch(/bg-accent\/15 text-accent/);
    expect(sidebar).not.toMatch(/#C8F000|#E8A317|emoji/);
  });

  it("ships a Tax hub with the locked tabs", () => {
    expect(existsSync(resolve(process.cwd(), "src/app/(dashboard)/tax/page.tsx"))).toBe(
      true,
    );
    for (const tab of ["Overview", "Reports", "Filing", "Statements", "Calculators"]) {
      expect(taxHub).toContain(tab);
    }
  });

  it("redirects stub /app and legacy tax routes", () => {
    expect(appPage).toMatch(/redirect\("\/dashboard"\)/);
    expect(nextConfig).toMatch(/source: "\/app"/);
    expect(nextConfig).toMatch(/destination: "\/dashboard"/);
    expect(nextConfig).toMatch(/source: "\/filing"/);
    expect(nextConfig).toMatch(/destination: "\/tax\?tab=filing"/);
    expect(nextConfig).toMatch(/source: "\/tax-reports"/);
    expect(nextConfig).toMatch(/destination: "\/tax\?tab=reports"/);
  });

  it("uses mobile bottom nav for the five primaries", () => {
    expect(shell).toMatch(/BottomNav/);
    expect(bottomNav).toMatch(/PRIMARY_NAV/);
    expect(bottomNav).toMatch(/More/);
    expect(nav).toMatch(/key: "dashboard"/);
    expect(nav).toMatch(/key: "books"/);
    expect(nav).toMatch(/key: "invoices"/);
    expect(nav).toMatch(/key: "tax"/);
    expect(topBar).toMatch(/"\/tax": "Tax"/);
    expect(topBar).toMatch(/"\/transactions": "Books"/);
  });
});

describe("IVA-76 dashboard DropZone", () => {
  it("uploads immediately with AUTO and falls back to GENERIC", () => {
    expect(copy).toMatch(/DEFAULT_BANK_CODE = "AUTO"/);
    expect(copy).toMatch(/FALLBACK_BANK_CODE = "GENERIC"/);
    expect(dropZone).toMatch(/bankCode", options\?\.bankCode \?\? DEFAULT_BANK_CODE/);
    expect(dropZone).toMatch(/\/api\/transactions\/upload-v2/);
  });

  it("locks first-run copy and CTA hierarchy", () => {
    expect(copy).toMatch(
      /Drop your bank statement \(CSV, Excel, or PDF\)/,
    );
    expect(copy).toMatch(/We'll detect the bank and update your books/);
    expect(dashboard).toMatch(/hasBooks \?/);
    expect(dashboard).toMatch(/DROP_COPY\.ctaImport/);
    expect(dashboard).toMatch(/DROP_COPY\.ctaInvoice/);
    expect(dashboard).toMatch(/variant="hero"/);
    expect(dashboard).toMatch(/variant="strip"/);
  });

  it("uses forest success for money-positive and toast copy", () => {
    expect(dashboard).toMatch(/text-success/);
    expect(copy).toMatch(/transactions added · books updated/);
    expect(copy).toMatch(/View books/);
    expect(dashboard).not.toMatch(/#C8F000|#E8A317/);
  });
});
