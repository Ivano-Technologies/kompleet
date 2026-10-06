import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("IVA-85 review triage lock", () => {
  it("ships locked spec + comps", () => {
    for (const file of [
      "kompleet-design/iva-85-review-triage/REVIEW-TRIAGE.md",
      "kompleet-design/iva-85-review-triage/shipping-handoff-iva85.txt",
      "kompleet-design/iva-85-review-triage/comps/banner-to-list.html",
      "kompleet-design/iva-85-review-triage/comps/row-actions.html",
    ]) {
      expect(existsSync(resolve(process.cwd(), file))).toBe(true);
    }
  });

  it("locks banner copy and outline Review CTA — not teal", () => {
    const copy = read("src/components/import/statement-copy.ts");
    const banner = read("src/components/import/ImportToast.tsx");
    expect(copy).toMatch(/need a quick check/);
    expect(copy).toMatch(/bannerReviewCta: "Review"/);
    expect(banner).toMatch(/AlertTriangle/);
    expect(banner).toMatch(/onReview/);
    expect(banner).toMatch(/bg-surface/);
    expect(banner).toMatch(/text-primary/);
    expect(banner).not.toMatch(/btn-primary/);
    expect(banner).not.toMatch(/bg-accent/);
  });

  it("opens a list sheet instead of the sequential Review wizard", () => {
    const sheet = read("src/components/review/TriageSheet.tsx");
    const review = read("src/app/(dashboard)/transactions/review/page.tsx");
    const toast = read("src/components/import/ImportToast.tsx");
    expect(sheet).toMatch(/Quick check|TRIAGE_COPY\.title/);
    expect(sheet).toMatch(/lg:w-\[520px\]/);
    expect(sheet).toMatch(/categorise/);
    expect(sheet).toMatch(/Ignore all low-confidence|bulkIgnoreLow/);
    expect(sheet).toMatch(/QuietLoadWarn/);
    expect(sheet).toMatch(/TRIAGE_COPY\.loadError/);
    expect(sheet).toMatch(/} catch \{/);
    expect(sheet).not.toMatch(/Skip for now/);
    expect(review).toMatch(/TriageSheet/);
    expect(review).not.toMatch(/Review Transactions/);
    expect(review).not.toMatch(/currentIndex/);
    expect(toast).toMatch(/onFixReview/);
    expect(toast).not.toMatch('href="/transactions/review"');
  });

  it("keeps Review out of primary nav and does not touch AUTO drop", () => {
    const nav = read("src/components/layout/dashboard/nav-config.ts");
    const sidebar = read("src/components/layout/dashboard/Sidebar.tsx");
    const drop = read("src/components/import/StatementDropZone.tsx");
    expect(nav).not.toMatch("/transactions/review");
    expect(sidebar).not.toMatch("/transactions/review");
    expect(drop).toMatch(/DEFAULT_BANK_CODE/);
    expect(drop).toMatch(/\/api\/transactions\/upload-v2/);
  });

  it("uses locked copy keys and Option C tokens", () => {
    const copy = read("src/components/review/triage-copy.ts");
    const sheet = read("src/components/review/TriageSheet.tsx");
    expect(copy).toMatch(/You’re all caught up|You're all caught up/);
    expect(copy).toMatch(/Uncategorised/);
    expect(copy).toMatch(/Duplicate suspect/);
    expect(copy).toMatch(/Low confidence/);
    expect(copy).toMatch(/Ignore all low-confidence/);
    expect(copy).toMatch(/Couldn’t load exceptions — try again/);
    expect(copy).not.toMatch(/JUO|AI-powered|Inbox zero/);
    expect(sheet).toMatch(/text-success/);
    expect(sheet).not.toMatch(/#C8F000|#E8A317/);
    expect(sheet).not.toMatch(/Skip for now/);
  });

  it("falls back when triage Convex mutations are undeployed", () => {
    const route = read("src/app/api/transactions/triage/route.ts");
    const fallback = read("src/lib/transactions/triage-fallback.ts");
    expect(route).toMatch(/applyTriageFallback/);
    expect(route).toMatch(/withConvexRetry/);
    expect(fallback).toMatch(/applyTriageMine/);
    expect(fallback).toMatch(/updateMine/);
  });
});
