import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

const RATE_LIMITED_ROUTES = [
  "src/app/api/auth/route.ts",
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/change-password/route.ts",
  "src/app/api/auth/delete-account/route.ts",
  "src/app/api/contact/route.ts",
  "src/app/api/upload-avatar/route.ts",
  "src/app/api/expenses/receipt/route.ts",
  "src/app/api/expenses/ocr/route.ts",
  "src/app/api/transactions/upload/route.ts",
  "src/app/api/transactions/upload-v2/route.ts",
  "src/app/api/ingest/route.ts",
  "src/app/api/v1/documents/upload/route.ts",
  "src/app/api/ai/categorize/route.ts",
  "src/app/api/ai/batch-categorize/route.ts",
  "src/app/api/categorize/route.ts",
] as const;

describe("rate-limited sensitive routes", () => {
  it.each(RATE_LIMITED_ROUTES)("%s wraps handlers with withRateLimit", (rel) => {
    expect(read(rel)).toMatch(/withRateLimit/);
  });

  it("uses @upstash/ratelimit when Redis env is present", () => {
    const source = read("src/lib/rate-limit.ts");
    expect(source).toMatch(/from "@upstash\/ratelimit"/);
    expect(source).toMatch(/from "@upstash\/redis"/);
    expect(source).toMatch(/UPSTASH_REDIS_REST_URL/);
    expect(source).toMatch(/UPSTASH_REDIS_REST_TOKEN/);
    expect(source).toMatch(/Ratelimit\.slidingWindow/);
  });
});
