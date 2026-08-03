import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL is configurable so the same suite can run against a local dev server,
 * a Vercel preview, or staging:
 *
 *   pnpm test:e2e                                        # boots `pnpm dev` on :3000
 *   E2E_BASE_URL=https://staging.example pnpm test:e2e    # runs against a deployment
 *
 * When E2E_BASE_URL (or PLAYWRIGHT_BASE_URL) is set, Playwright does NOT start a
 * local dev server — it assumes the target is already up.
 *
 * Credentials for the seeded test account come from E2E_USER_EMAIL /
 * E2E_USER_PASSWORD. This repository is public: never inline them here.
 * See e2e/README.md.
 */
const EXTERNAL_BASE_URL =
  process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "";
const LOCAL_BASE_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Nigerian bank statement parsing, Tesseract OCR and Excel/ZIP generation are
  // all server-side and comparatively slow, so the per-test budget is generous.
  timeout: process.env.CI ? 120_000 : 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 2 : 0,
  // Several specs write to the same test account (transactions, calculation
  // history, export history), so CI stays single-worker to keep assertions on
  // "the most recent record" deterministic.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : "html",
  use: {
    baseURL: EXTERNAL_BASE_URL || LOCAL_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: LOCAL_BASE_URL,
        reuseExistingServer: !process.env.CI,
        // A cold Next.js dev boot plus first-request compilation is slow in CI.
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
