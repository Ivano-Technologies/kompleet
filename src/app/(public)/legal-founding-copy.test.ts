import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const terms = read("src/app/(public)/terms/page.tsx");
const privacy = read("src/app/(public)/privacy/page.tsx");
const cookies = read("src/app/(public)/cookies/page.tsx");
const pricing = read("src/app/(public)/pricing/page.tsx");
const legalAndPricing = { terms, privacy, cookies, pricing };

const FREE_PLAN_COPY = /\bfree\b|no-cost|no cost|₦0/i;

describe("founding-access copy on legal and pricing pages", () => {
  it("does not mention a free, no-cost, or ₦0 plan", () => {
    for (const [name, source] of Object.entries(legalAndPricing)) {
      expect(source, name).not.toMatch(FREE_PLAN_COPY);
    }
  });

  it("uses Kompleet, not KOMPLEET, in legal body copy", () => {
    expect(terms).not.toMatch(/KOMPLEET/);
    expect(privacy).not.toMatch(/KOMPLEET/);
    expect(cookies).not.toMatch(/KOMPLEET/);
    expect(terms).toMatch(/Welcome to Kompleet/);
    expect(privacy).toMatch(/Kompleet is provided by/);
    expect(cookies).toMatch(/Kompleet uses a small number of cookies/);
  });

  it("keeps Terms §17 in sentence case and renders it uppercase", () => {
    expect(terms).toMatch(
      /By using Kompleet, you acknowledge that you have read, understood,/,
    );
    expect(terms).not.toMatch(/BY USING Kompleet/);
    const ack = terms.slice(terms.indexOf("17. Acknowledgment"));
    expect(ack).toMatch(/className="uppercase /);
  });

  it("does not keep a current-access ₦0 plan card on /pricing", () => {
    expect(pricing).not.toMatch(/data-plan="current"/);
    expect(pricing).not.toMatch(/Current access/);
    expect(pricing).toMatch(/href="\/signup"/);
    expect(pricing).toMatch(/href="\/login"/);
    expect(pricing).toMatch(/Get started/);
    expect(pricing).not.toMatch(/₦/);
  });
});
