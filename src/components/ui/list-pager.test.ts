import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { showingCount } from "./list-pager";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("showingCount", () => {
  it("uses singular and plural nouns without a parenthetical s", () => {
    expect(showingCount(1, "expense", "expenses")).toBe("Showing 1 expense");
    expect(showingCount(100, "expense", "expenses")).toBe(
      "Showing 100 expenses",
    );
    expect(showingCount(1, "transaction", "transactions")).toBe(
      "Showing 1 transaction",
    );
    expect(showingCount(50, "file", "files")).toBe("Showing 50 files");
  });
});

describe("list copy in shipped pages", () => {
  it("does not ship expense(s) or generic entries labels", () => {
    const expenses = read("src/app/(dashboard)/expenses/page.tsx");
    const books = read("src/app/(dashboard)/transactions/page.tsx");
    const docs = read("src/app/(dashboard)/documents/page.tsx");
    expect(expenses).not.toMatch(/expense\(s\)/);
    expect(books).not.toMatch(/ of .* entries/);
    expect(docs).toMatch(/showingCount/);
    expect(docs).toMatch(/LoadMoreButton/);
    expect(expenses).toMatch(/LoadMoreButton/);
    expect(books).toMatch(/PageTurnButtons/);
  });

  it("keeps Load more inside the same card footer pattern as Books", () => {
    const expenses = read("src/app/(dashboard)/expenses/page.tsx");
    const docs = read("src/app/(dashboard)/documents/page.tsx");
    const pager = read("src/components/ui/list-pager.tsx");
    expect(pager).toMatch(/aria-label="Previous page"/);
    expect(pager).toMatch(/aria-label="Next page"/);
    expect(pager).toMatch(/min-h-11 min-w-11/);
    expect(pager).toMatch(/Loading…/);
    const expensesFooter = expenses.indexOf("<ListCardFooter");
    const expensesLoad = expenses.indexOf("<LoadMoreButton");
    const expensesCardClose = expenses.lastIndexOf("</div>");
    expect(expensesFooter).toBeGreaterThan(-1);
    expect(expensesLoad).toBeGreaterThan(expensesFooter);
    expect(expensesCardClose).toBeGreaterThan(expensesLoad);
    const docsFooter = docs.indexOf("<ListCardFooter");
    const docsLoad = docs.indexOf("<LoadMoreButton");
    expect(docsFooter).toBeGreaterThan(-1);
    expect(docsLoad).toBeGreaterThan(docsFooter);
  });
});
