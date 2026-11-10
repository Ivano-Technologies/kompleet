import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTENT_SECURITY_POLICY } from "@/lib/content-security-policy.mjs";
import { getPrimaryProvider, getProviderWithFallback } from "./factory";

const SRC_ROOT = join(process.cwd(), "src");
const MOONSHOT_HOST = /api\.moonshot\.cn/i;
const MOONSHOT_ENV = /KIMI_API_KEY|MOONSHOT_API_KEY/i;

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (
      entry === "node_modules" ||
      entry === ".next" ||
      entry === "coverage" ||
      entry === "dist"
    ) {
      continue;
    }
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkSourceFiles(full, acc);
      continue;
    }
    if (
      /\.(ts|tsx|js|mjs|cjs)$/.test(entry) &&
      !/\.test\.(ts|tsx|js)$/.test(entry)
    ) {
      acc.push(full);
    }
  }
  return acc;
}

describe("Moonshot / Kimi is hard-disabled", () => {
  afterEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.KIMI_API_KEY;
    delete process.env.MOONSHOT_API_KEY;
    vi.unstubAllGlobals();
  });

  it("does not list api.moonshot.cn in CSP connect-src", () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/moonshot/i);
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/kimi/i);
    expect(CONTENT_SECURITY_POLICY).toContain("connect-src 'self'");
  });

  it("contains no runtime Moonshot host or env-name references under src/", () => {
    const files = walkSourceFiles(SRC_ROOT);
    const offenders: string[] = [];
    for (const file of files) {
      if (file.endsWith("moonshot-disabled.test.ts")) continue;
      const text = readFileSync(file, "utf8");
      if (MOONSHOT_HOST.test(text) || MOONSHOT_ENV.test(text)) {
        offenders.push(relative(SRC_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("never fetches api.moonshot.cn even when Moonshot env vars are set", async () => {
    const previousOpenAi = process.env.OPENAI_API_KEY;
    const previousAnthropic = process.env.ANTHROPIC_API_KEY;
    const previousClaude = process.env.CLAUDE_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_API_KEY;
    process.env.AI_PROVIDER = "kimi";
    process.env.KIMI_API_KEY = "sk-test-kimi";
    process.env.MOONSHOT_API_KEY = "sk-test-moonshot";

    const hits: string[] = [];
    const originalFetch = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        hits.push(url);
        if (MOONSHOT_HOST.test(url)) {
          throw new Error(`blocked request to ${url}`);
        }
        if (typeof originalFetch === "function") {
          return originalFetch(input, init);
        }
        return new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    );

    try {
      const primary = await getPrimaryProvider();
      const withFallback = await getProviderWithFallback();
      expect(primary.name).not.toMatch(/kimi|moonshot/i);
      expect(withFallback.name).not.toMatch(/kimi|moonshot/i);
      expect(hits.filter((url) => MOONSHOT_HOST.test(url))).toEqual([]);
    } finally {
      if (previousOpenAi === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousOpenAi;
      if (previousAnthropic === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = previousAnthropic;
      if (previousClaude === undefined) delete process.env.CLAUDE_API_KEY;
      else process.env.CLAUDE_API_KEY = previousClaude;
    }
  });
});
