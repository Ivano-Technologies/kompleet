import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const dashboard = read("src/app/(dashboard)/dashboard/DashboardClient.tsx");
const dashboardPage = read("src/app/(dashboard)/dashboard/page.tsx");
const books = read("src/app/(dashboard)/transactions/page.tsx");
const shell = read("src/components/layout/dashboard/DashboardShell.tsx");
const sidebar = read("src/components/layout/dashboard/Sidebar.tsx");
const bottomNav = read("src/components/layout/dashboard/BottomNav.tsx");
const globals = read("src/app/globals.css");
const layout = read("src/app/layout.tsx");
const manifest = read("public/manifest.json");
const docsCopy = read("src/components/documents/docs-copy.ts");
const docsHint = read("src/components/documents/DocsEmptyHint.tsx");
const docsToast = read("src/components/documents/DocsToast.tsx");
const hub = read("src/app/(dashboard)/documents/page.tsx");
const dropCopy = read("src/components/import/statement-copy.ts");
const duplicates = read("src/app/(dashboard)/transactions/duplicates/page.tsx");
const filing = read("src/app/(dashboard)/filing/page.tsx");
const filingHistory = read("src/components/filing-history.tsx");
const quiet = read("src/components/feedback/QuietLoadWarn.tsx");
const importErrors = read("src/components/import/ImportErrorCard.tsx");

describe("IVA-86 §1 empty money vs zero", () => {
  it("gates happy KPIs on hasRealBooks from successful imports, not txn count alone", () => {
    expect(dashboardPage).toMatch(/computeHasRealBooks/);
    expect(dashboardPage).toMatch(/api\.imports\.listMine/);
    expect(dashboardPage).toMatch(/hasRealBooks=\{hasRealBooks\}/);
    expect(dashboardPage).not.toMatch(/hasBooks=\{booksPage\.total > 0\}/);
    expect(dashboard).toMatch(/if \(!hasRealBooks\)/);
    expect(dashboard).toMatch(/label: "Revenue"/);
    expect(dashboard.indexOf("if (!hasRealBooks)")).toBeLessThan(
      dashboard.indexOf('label: "Revenue"'),
    );
  });

  it("keeps www demo default off and chips Demo data only when explicitly enabled", () => {
    expect(read("src/lib/dashboard/has-real-books.ts")).toMatch(
      /isDemoBooksEnabled/,
    );
    expect(dashboardPage).toMatch(/NEXT_PUBLIC_ALLOW_DEMO_BOOKS/);
    expect(dropCopy).toMatch(/demoChip: "Demo data"/);
    expect(dashboard).toMatch(/DROP_COPY\.demoChip/);
    expect(dashboard).toMatch(/border-primary/);
  });
});

describe("IVA-86 §2 mobile dual scrollbars", () => {
  it("makes DashboardShell the single mobile scroll owner", () => {
    expect(shell).toMatch(/h-dvh/);
    expect(shell).toMatch(/dashboard-shell-scroll-lock/);
    expect(shell).toMatch(/flex-1 min-h-0 overflow-y-auto/);
    expect(shell).toMatch(/pb-\[calc\(4\.25rem\+env\(safe-area-inset-bottom\)\)\]/);
    expect(shell).not.toMatch(/h-screen/);
    expect(shell).not.toMatch(/overflow-auto pb-20/);
    expect(globals).toMatch(/html\.dashboard-shell-scroll-lock/);
    expect(globals).toMatch(/overflow: hidden/);
  });

  it("keeps desktop sidebar overflow and only scrolls the mobile drawer while open", () => {
    expect(sidebar).toMatch(/hidden lg:flex[\s\S]*overflow-hidden/);
    expect(sidebar).toMatch(/lg:overflow-y-auto/);
    expect(sidebar).toMatch(/isMobileOpen &&/);
    expect(sidebar).toMatch(
      /fixed inset-y-0 left-0 w-80 z-50 shadow-outer-deep overflow-y-auto/,
    );
    expect(bottomNav).toMatch(/fixed bottom-0/);
    expect(bottomNav).toMatch(/pb-\[env\(safe-area-inset-bottom\)\]/);
  });
});

describe("IVA-86 §3 Documents vs Books", () => {
  it("links Books + Dashboard on Documents empty and Documents on Books empty", () => {
    expect(docsCopy).toMatch(
      /Bank statements\? Drop them on Books or Dashboard/,
    );
    expect(docsHint).toMatch(/href="\/transactions"/);
    expect(docsHint).toMatch(/href="\/dashboard"/);
    expect(dropCopy).toMatch(/Receipts & other files go in Documents/);
    expect(books).toMatch(/DROP_COPY\.booksDocsHint/);
    expect(books).toMatch(/href="\/documents"/);
  });

  it("shows a soft statement toast with Import / Keep and no blocking modal", () => {
    expect(hub).toMatch(/toastStatementKeep/);
    expect(hub).toMatch(/\/transactions\?import=1/);
    expect(hub).toMatch(/tone: "nudge"/);
    expect(docsToast).toMatch(/btn-primary/);
    expect(docsToast).not.toMatch(/Dialog|modal/);
    expect(hub).not.toMatch(/window\.setTimeout/);
  });
});

describe("IVA-86 §4 favicon HTML metadata", () => {
  it("ships exact Wave 1 teal ₦ head links and theme-color", () => {
    expect(layout).toMatch(
      /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml" \/>/,
    );
    expect(layout).toMatch(
      /<link rel="icon" href="\/favicon-32\.png" sizes="32x32" type="image\/png" \/>/,
    );
    expect(layout).toMatch(
      /<link rel="icon" href="\/favicon-16\.png" sizes="16x16" type="image\/png" \/>/,
    );
    expect(layout).toMatch(
      /<link rel="apple-touch-icon" href="\/apple-touch-180\.png" \/>/,
    );
    expect(layout).toMatch(/<meta name="theme-color" content="#0D9488" \/>/);
    expect(layout).toMatch(/themeColor: "#0D9488"/);
    expect(manifest).toMatch(/"theme_color": "#0D9488"/);
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
});

describe("IVA-86 §5 quiet non-blocking 500s", () => {
  it("warns on duplicates and forms list without replacing the shell", () => {
    expect(quiet).toMatch(/Couldn’t load duplicates — try again/);
    expect(quiet).toMatch(/Couldn’t load forms — try again/);
    expect(quiet).toMatch(/Retry/);
    expect(quiet).toMatch(/Unavailable right now/);
    expect(quiet).toMatch(/AlertTriangle/);
    expect(quiet).toMatch(/bg-warning\/10/);
    expect(duplicates).toMatch(/QuietLoadWarn/);
    expect(duplicates).toMatch(/QUIET_500_COPY\.duplicatesStrip/);
    expect(filing).toMatch(/QuietLoadWarn/);
    expect(filingHistory).toMatch(/QuietLoadWarn/);
  });

  it("does not soften IVA-83 import hard errors", () => {
    expect(importErrors).toMatch(/ImportErrorCard/);
    expect(read("src/components/import/StatementDropZone.tsx")).toMatch(
      /ImportErrorCard/,
    );
  });
});
