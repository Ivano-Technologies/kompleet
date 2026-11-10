import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isThemeShotsBlocked } from "@/lib/theme-shots-gate";

const layout = readFileSync(
  resolve(process.cwd(), "src/app/dev/theme-shots/layout.tsx"),
  "utf8",
);
const proxy = readFileSync(resolve(process.cwd(), "src/proxy.ts"), "utf8");
const books = readFileSync(
  resolve(process.cwd(), "src/app/dev/theme-shots/books/page.tsx"),
  "utf8",
);
const dashboard = readFileSync(
  resolve(process.cwd(), "src/app/dev/theme-shots/dashboard/page.tsx"),
  "utf8",
);
const dashboardClient = readFileSync(
  resolve(process.cwd(), "src/app/(dashboard)/dashboard/DashboardClient.tsx"),
  "utf8",
);
const audit = readFileSync(
  resolve(process.cwd(), "src/app/dev/theme-shots/audit/page.tsx"),
  "utf8",
);

describe("theme-shot harness", () => {
  it("404s in production and wraps real DashboardShell with mocked auth", () => {
    expect(layout).toMatch(/isThemeShotsBlocked\(\)/);
    expect(layout).toMatch(/notFound\(\)/);
    expect(proxy).toMatch(/\/dev\/theme-shots/);
    expect(proxy).toMatch(/isThemeShotsBlocked\(\)/);
    expect(dashboard).toMatch(/DashboardShell/);
    expect(dashboard).toMatch(/ada@example.com/);
    expect(dashboard).toMatch(/DashboardClient/);
    expect(dashboard).toMatch(/month: "Jul"/);
    expect(dashboardClient).toMatch(/function RevenueTrendChart/);
    expect(dashboardClient).toMatch(/aria-label="Revenue trend"/);
    expect(dashboardClient).toMatch(/fill="rgb\(var\(--accent\)\)"/);
    expect(books).toMatch(/DashboardShell/);
    expect(books).toMatch(/!pl-10/);
    expect(books).toMatch(/whitespace-nowrap w-\[1%\]/);
    expect(books).toMatch(/min-w-0 max-w-0/);
    expect(books).toMatch(/Search transactions/);
    expect(books).toMatch(/₦12,450,000\.00/);
    expect(audit).toMatch(/DashboardShell/);
    expect(audit).toMatch(/Chukwuemeka Okonkwo-Adebayo/);
    expect(audit).toMatch(/InvoicesPage/);
    expect(audit).toMatch(/ConfirmDialog/);
    expect(audit).toMatch(/installAuditShotFetch/);
  });

  it("blocks when NODE_ENV or VERCEL_ENV is production", () => {
    expect(isThemeShotsBlocked({ NODE_ENV: "development" })).toBe(false);
    expect(isThemeShotsBlocked({ NODE_ENV: "test" })).toBe(false);
    expect(isThemeShotsBlocked({ NODE_ENV: "production" })).toBe(true);
    expect(isThemeShotsBlocked({ VERCEL_ENV: "production" })).toBe(true);
    expect(isThemeShotsBlocked({ VERCEL_ENV: "preview" })).toBe(false);
    expect(
      isThemeShotsBlocked({ NODE_ENV: "production", VERCEL_ENV: "preview" }),
    ).toBe(true);
  });
});
