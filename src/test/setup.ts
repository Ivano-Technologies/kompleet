// Mock environment variables for tests
process.env.CI = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ_test_placeholder";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJ_test_placeholder";
process.env.OPENAI_API_KEY = "sk-test_placeholder";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
delete process.env.RESEND_API_KEY;
delete process.env.AUTH_RESEND_KEY;

import "@testing-library/jest-dom/vitest";
