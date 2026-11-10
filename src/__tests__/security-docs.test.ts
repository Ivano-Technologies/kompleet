import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("docs/security pack", () => {
  it("names NDPC 72-hour notice, support mailbox and DPO", () => {
    const ir = read("docs/security/incident-response.md");
    expect(ir).toMatch(/72 hours/);
    expect(ir).toMatch(/support@ivanotechnologies\.com/);
    expect(ir).toMatch(/David Inalegwu/);
  });

  it("covers retention, backup draft, sub-processors and access control", () => {
    expect(read("docs/security/data-retention.md")).toMatch(/six years/);
    expect(read("docs/security/backup-and-recovery.md")).toMatch(
      /needs owner approval/i,
    );
    const processors = read("docs/security/sub-processors.md");
    expect(processors).toMatch(/Convex/);
    expect(processors).toMatch(/Vercel/);
    expect(processors).toMatch(/Resend/);
    expect(processors).toMatch(/Sentry/);
    expect(processors).toMatch(/OpenAI/);
    expect(processors).toMatch(/Anthropic/);
    expect(processors).toMatch(/Moonshot/);
    expect(processors).toMatch(/Upstash Redis/);
    expect(read("docs/security/access-control.md")).toMatch(/getCurrentUser/);
  });
});
