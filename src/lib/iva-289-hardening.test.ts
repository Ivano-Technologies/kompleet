import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("IVA-289 hardening", () => {
  it("ships CSP as Report-Only and names GA, Sentry, Convex", () => {
    const config = read("next.config.mjs");
    expect(config).toContain('key: "Content-Security-Policy-Report-Only"');
    expect(config).not.toContain('key: "Content-Security-Policy"');
    expect(config).toMatch(/content-security-policy\.mjs/);
  });

  it("does not read NEXT_PUBLIC_OPEN_AI_API_KEY in categorize or parsers", () => {
    expect(read("src/app/api/ai/categorize/route.ts")).not.toMatch(
      /NEXT_PUBLIC_OPEN_AI_API_KEY/,
    );
    expect(read("src/app/api/ai/batch-categorize/route.ts")).not.toMatch(
      /NEXT_PUBLIC_OPEN_AI_API_KEY/,
    );
    expect(read("src/lib/transaction-import/pdf-parser.ts")).not.toMatch(
      /NEXT_PUBLIC_OPEN_AI_API_KEY/,
    );
  });

  it("rate-limits public and auth-adjacent routes", () => {
    expect(read("src/app/api/auth/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/auth/login/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/auth/ensure-profile/route.ts")).toMatch(
      /withRateLimit/,
    );
    expect(read("src/app/api/auth/profile/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/contact/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/feedback/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/upload-avatar/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/year/switch/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/admin/users/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/tax/sources/check/route.ts")).toMatch(
      /withRateLimit/,
    );
    expect(read("src/app/api/migration/migrate/route.ts")).toMatch(
      /withRateLimit/,
    );
    expect(read("src/app/api/expenses/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/expenses/[id]/route.ts")).toMatch(/withRateLimit/);
    expect(read("src/app/api/expenses/export/route.ts")).toMatch(
      /withRateLimit/,
    );
    expect(read("src/app/api/export/bulk/route.ts")).toMatch(/withRateLimit/);
  });

  it("uses EmptyState on list tables that were a blank tbody", () => {
    expect(read("src/components/records/RecordsList.tsx")).toMatch(/EmptyState/);
    expect(read("src/app/admin/team/page.tsx")).toMatch(/EmptyState/);
    expect(read("src/app/(dashboard)/export/page.tsx")).toMatch(/EmptyState/);
    expect(read("src/app/(dashboard)/transactions/page.tsx")).toMatch(
      /EmptyState/,
    );
  });

  it("uses Coco empty copy without We'll contractions or dashes", () => {
    const invoices = read("src/components/invoices/invoice-copy.ts");
    const statements = read("src/components/import/statement-copy.ts");
    const team = read("src/app/admin/team/page.tsx");
    expect(invoices).toContain('emptyDropSub: "Draft an invoice you can edit."');
    expect(invoices).not.toMatch(/We'll draft an invoice/);
    expect(statements).toContain(
      'heroSub: "Detects the bank and updates your books."',
    );
    expect(statements).not.toMatch(/We'll detect the bank/);
    expect(team).toContain('title: "No team members yet"');
    expect(team).toContain(
      "This page cannot send invitations, and roles cannot be changed yet.",
    );
    expect(team).not.toMatch(/Invite member/);
    expect(team).not.toMatch(/href: "\/signup"/);
    expect(team).not.toMatch(/action=\{\{/);
    expect(team).not.toMatch(/set their role/);
    expect(team).not.toMatch(/Manage user roles/);
    expect(team).not.toMatch(/We'll/);
    expect(team).not.toMatch(/[\u2013\u2014]/);
  });
});
