import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layout = readFileSync(
  resolve(process.cwd(), "src/app/dev/theme-shots/layout.tsx"),
  "utf8",
);
const books = readFileSync(
  resolve(process.cwd(), "src/app/dev/theme-shots/books/page.tsx"),
  "utf8",
);
const dashboard = readFileSync(
  resolve(process.cwd(), "src/app/dev/theme-shots/dashboard/page.tsx"),
  "utf8",
);

describe("theme-shot harness", () => {
  it("404s in production and wraps real DashboardShell with mocked auth", () => {
    expect(layout).toMatch(/NODE_ENV === "production"/);
    expect(layout).toMatch(/notFound\(\)/);
    expect(dashboard).toMatch(/DashboardShell/);
    expect(dashboard).toMatch(/ada@example.com/);
    expect(dashboard).toMatch(/DashboardClient/);
    expect(books).toMatch(/DashboardShell/);
    expect(books).toMatch(/!pl-10/);
    expect(books).toMatch(/whitespace-nowrap w-\[1%\]/);
    expect(books).toMatch(/Search transactions/);
    expect(books).toMatch(/₦12,450,000\.00/);
  });
});
