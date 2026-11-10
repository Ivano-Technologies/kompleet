import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSentryDsn } from "./dsn";

describe("resolveSentryDsn", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers SENTRY_DSN then NEXT_PUBLIC_SENTRY_DSN over the public fallback", () => {
    vi.stubEnv("SENTRY_DSN", "https://env@example.ingest.sentry.io/1");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://public@example.ingest.sentry.io/2");
    expect(resolveSentryDsn()).toBe("https://env@example.ingest.sentry.io/1");
  });

  it("falls back to the public kompleet-platform DSN when env is unset", () => {
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    const dsn = resolveSentryDsn();
    expect(dsn).toMatch(/^https:\/\/[a-f0-9]+@o\d+\.ingest\.de\.sentry\.io\/\d+$/);
    expect(dsn).toContain("ingest.de.sentry.io");
  });
});
