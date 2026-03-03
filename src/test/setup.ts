// Mock environment variables for tests
process.env.CI = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ_test_placeholder";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJ_test_placeholder";
process.env.OPENAI_API_KEY = "sk-test_placeholder";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

import "@testing-library/jest-dom/vitest";

// #region agent log
fetch("http://127.0.0.1:7618/ingest/0be0fd3d-ce28-4416-8e00-446736413fdd", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "b3c43a"
  },
  body: JSON.stringify({
    sessionId: "b3c43a",
    runId: "pre-fix",
    hypothesisId: "H1",
    location: "src/test/setup.ts:11",
    message: "Vitest setup loaded",
    data: { ci: process.env.CI, worker: process.env.VITEST_WORKER_ID ?? "n/a" },
    timestamp: Date.now()
  })
}).catch(() => {});
// #endregion
