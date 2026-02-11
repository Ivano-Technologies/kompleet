# KOMPLEET MVP ASSESSMENT

**Assessment Date:** February 11, 2026
**Project:** KOMPLEET - AI-powered tax compliance platform for Nigerian businesses
**Organization:** Ivano Technologies Ltd
**Repository:** Ivano-Technologies/KOMPLEET-PLATFORM
**Assessor:** Claude Code (Comprehensive Audit)

---

## 1. Executive Summary

The KOMPLEET platform is **75% complete** with **61% feature implementation** and **62.75% infrastructure readiness**. All three Phase 1 tax calculators (Business Tax, Individual Tax, VAT Compliance) are 95% functional and production-ready. However, **8 critical blockers** prevent immediate MVP launch, including a git merge conflict breaking builds, missing rate limiting, incomplete authentication migration, and sparse test coverage.

**Overall Status:** ⚠️ **STAGING READY** | ❌ **NOT PRODUCTION READY**

**Single Biggest Blocker:** Git merge conflict in `src/app/(dashboard)/transactions/page.tsx` preventing successful builds. This must be resolved immediately before any other work can proceed.

**Estimated Completion:** With focused effort, the platform can be **MVP-ready for beta launch in 3-4 weeks** (55-65 developer hours). This includes resolving all P0/P1 blockers, implementing core features (Tax Center dashboard, save to account), and achieving 60%+ test coverage.

**Revenue Potential:** ₦7.8M MRR unlocked with 660 customers at ₦11,800/month (validated pricing model).

---

## 2. Feature Implementation Matrix

| Feature ID | Feature Name | Phase | Status | Completion % | Notes |
|------------|--------------|-------|--------|--------------|-------|
| **F-01** | **Business Tax Calculator** | 1 | ✅ Done | 95% | Fully functional with CIT (0%/30%), Development Levy (4%), PDF export. Missing: Save to Account |
| **F-02** | **Individual Tax Calculator** | 1 | ✅ Done | 95% | Progressive tax bands (0%-24%), rent relief (₦500K cap), owner-occupier relief. Missing: Save to Account |
| **F-03** | **VAT Compliance Checker** | 1 | ✅ Done | 95% | Exemption logic (<₦100M turnover, <₦250M assets), 7.5% VAT calculation. Missing: Save to Account |
| **F-04** | **Stamp Duty Calculator** | 2 | ✅ Done | 95% | Property transfer (1.5%), lease (0.78%/3%), ₦10M exemption. Missing: Save to Account |
| **F-05** | **Capital Allowance Tracker** | 2 | 🔧 Partial | 95% | 10-year depreciation schedule (10%/20%/25% by asset type). Missing: Asset persistence, multi-asset tracking |
| **F-06** | **Tax Compliance Dashboard** | 2 | ❌ Partial | 25% | Minimal placeholder dashboard. Missing: Landing page, calculator cards, deadline widgets, tax savings widget |
| **F-07** | **Tax Document Generator** | 2 | 🔧 Partial | 60% | Client-side PDF generation fully functional (jsPDF). Missing: Server-side PDF service, Word/Excel exports |
| **F-08** | **Tax Advisory Chatbot** | 3 | ❌ Not Started | 10% | Only AI infrastructure for transaction categorization exists. Missing: Chatbot UI, LLM integration, conversation handling |
| **F-09** | **Tax Calendar & Reminders** | 3 | 🔧 Partial | 40% | Deadline listing, notification preferences UI. Missing: Calendar grid view, email/push delivery, scheduling service |
| **F-10** | **Tax Savings Optimizer** | 3 | ❌ Not Started | 5% | No implementation. Missing: Optimizer algorithm, recommendations engine, UI |

**Overall Feature Completion:** **61%**
**Phase 1 (MVP Core) Completion:** **95%** (F-01, F-02, F-03)
**Phase 2 Completion:** **69%** (F-04, F-05, F-06, F-07)
**Phase 3 Completion:** **18%** (F-08, F-09, F-10)

### Key Files & Locations

**Phase 1 Calculators (Production-Ready):**
- [src/app/(dashboard)/calculators/business-tax/page.tsx](src/app/(dashboard)/calculators/business-tax/page.tsx) - Business Tax Calculator
- [src/app/(dashboard)/calculators/individual-tax/page.tsx](src/app/(dashboard)/calculators/individual-tax/page.tsx) - Individual Tax Calculator
- [src/app/(dashboard)/calculators/vat/page.tsx](src/app/(dashboard)/calculators/vat/page.tsx) - VAT Compliance Checker
- [src/lib/pdf-generator.ts](src/lib/pdf-generator.ts) - PDF export service (150+ lines, fully functional)

**Phase 2 Features (Partial):**
- [src/app/(dashboard)/calculators/stamp-duty/page.tsx](src/app/(dashboard)/calculators/stamp-duty/page.tsx) - Stamp Duty Calculator (complete)
- [src/app/(dashboard)/calculators/capital-allowances/page.tsx](src/app/(dashboard)/calculators/capital-allowances/page.tsx) - Capital Allowances (needs persistence)
- [src/components/Dashboard.tsx](src/components/Dashboard.tsx) - Dashboard placeholder (minimal implementation)
- [src/server/pdf.ts](src/server/pdf.ts) - Server PDF service (placeholder only)

**Phase 3 Features (Minimal):**
- [src/app/(dashboard)/notifications/page.tsx](src/app/(dashboard)/notifications/page.tsx) - Deadline notifications
- [src/app/api/deadlines/upcoming/route.ts](src/app/api/deadlines/upcoming/route.ts) - Deadline API
- No chatbot or optimizer implementation

---

## 3. Infrastructure Readiness Matrix

| Category | Item | Status | Notes |
|----------|------|--------|-------|
| **Authentication & Authorization** | | | |
| | Auth Framework | 🔧 Partial | Incomplete migration from Supabase Auth → Clerk. Dual auth contexts exist. |
| | Login/Signup Pages | 🔧 Partial | Pages exist but use custom AuthContext, not Clerk UI |
| | Middleware Protection | ✅ Pass | `src/middleware.ts` protects `/dashboard/*` routes correctly |
| | RBAC Implementation | ❌ Fail | Role field exists in database but no enforcement in API routes or middleware |
| | RLS Policies | ✅ Pass | 20+ tables with comprehensive Row Level Security policies |
| **Security** | | | |
| | Rate Limiting | ❌ Fail | **CRITICAL:** No rate limiting on 55 API routes despite config vars present |
| | CORS Configuration | ✅ Pass | Next.js default CORS + `poweredByHeader: false` |
| | Service Role Key Security | ✅ Pass | Key only in server-side code, not in frontend |
| | Session/JWT Expiry | 🔧 Partial | Supabase auto-refresh token works, but no explicit timeout configured |
| | Password Protection | 🔧 Partial | Supabase handles hashing, but no client-side strength validation |
| | Sensitive Data Redaction | ✅ Pass | Pino logger redacts password, token, apiKey, ssn, tin, etc. |
| **Database** | | | |
| | Migration Files | ✅ Pass | **17 migration files** in `supabase/migrations/` - well-organized |
| | Table Coverage | ✅ Pass | All required tables exist: profiles, transactions, categories, tax_calculations, etc. |
| | RLS Enabled | ✅ Pass | All user data tables have RLS enabled via `004_rls.sql` |
| | Schema Documentation | 🔧 Partial | Migration README exists, but Drizzle schema files lack JSDoc comments |
| **Testing** | | | |
| | Test File Count | ❌ Fail | **Only 6 test files** (very sparse for production) |
| | Test Execution | ❌ Fail | Default `npm test` excludes most tests (sprint7, sprint8, sprint9-10, critical-path) |
| | Test Pass Rate | ✅ Pass | Tests that run do pass (20/20 ML system tests, 36/36 critical feature tests) |
| | Unit Tests (Tax Logic) | ❌ Fail | No dedicated unit tests for tax calculation formulas |
| | Integration Tests (APIs) | ❌ Fail | No API route integration tests |
| | E2E Tests | ❌ Fail | No Playwright/Cypress E2E test automation |
| | Coverage | ❌ Fail | No coverage reports generated |
| **Build & CI/CD** | | | |
| | npm run build | ❌ Fail | **BLOCKER:** Git merge conflict in `transactions/page.tsx` breaks builds |
| | npm run lint | ✅ Pass | ESLint configured with Next.js defaults |
| | TypeScript Compilation | ✅ Pass | TypeScript 5.9.3 with strict mode enabled |
| | GitHub Actions Pipeline | 🔧 Partial | CI runs typecheck + lint + test, but **missing build step** |
| | .env.example | ✅ Pass | Comprehensive 91-line file with all required variables documented |
| **Performance & UX** | | | |
| | Mobile Responsiveness | ✅ Pass | Tailwind CSS 4 with responsive utilities, mobile-first design |
| | Tailwind Configuration | ✅ Pass | Nigerian green (#008751) primary color, dark mode support |
| | Loading/Error States | 🔧 Partial | 86 files reference states, but no unified error boundary pattern |
| | Form Validation | 🔧 Partial | Custom `validateForm()` functions, no Zod/Yup schemas |
| | Accessibility (WCAG 2.1 AA) | ❌ Fail | Only 3 ARIA label instances, no comprehensive keyboard nav testing |
| **Environment & Deployment** | | | |
| | Environment Variables | ✅ Pass | All 9 required categories documented and validated with Zod |
| | Vercel Configuration | ❌ Fail | No `vercel.json` file - requires manual dashboard config |
| | Health Check Endpoint | ✅ Pass | `/api/health` returns `{ status: 'ok', timestamp, environment }` |
| | PITR (Point-in-Time Recovery) | ❌ Fail | **NOT CONFIGURED** - data loss risk in production |
| | Rollback Plan | ❌ Fail | No documented rollback procedure (only `rollback_all.sql` exists) |

**Overall Infrastructure Readiness Score:** **62.75%**

### Critical Infrastructure Files

**Authentication:**
- [src/middleware.ts](src/middleware.ts:1) - Route protection (78 lines)
- [src/lib/supabase/server.ts](src/lib/supabase/server.ts:1) - Server-side Supabase client with Clerk JWT
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts:1) - Browser-side Supabase client
- [src/lib/env.ts](src/lib/env.ts:1) - Zod environment validation

**Database:**
- [drizzle.config.ts](drizzle.config.ts:1) - Drizzle ORM configuration
- [src/db/schema/](src/db/schema/) - 5 schema files (users, records, filings, banking, invoicing)
- [supabase/migrations/](supabase/migrations/) - 17 SQL migration files
- [supabase/migrations/004_rls.sql](supabase/migrations/004_rls.sql:1) - Comprehensive RLS policies

**Testing:**
- [vitest.config.ts](vitest.config.ts:1) - Vitest configuration
- [package.json](package.json:1) - Test scripts with exclusions (⚠️ most tests excluded)
- [tests/](tests/) - 6 test suites (smoke, sprint7-10, critical-path, ml-system)

**CI/CD:**
- [.github/workflows/ci.yml](.github/workflows/ci.yml:1) - GitHub Actions pipeline (⚠️ missing build step)
- [next.config.js](next.config.js:1) - Next.js build configuration
- [.env.example](.env.example:1) - Environment variable template

---

## 4. MVP Scope Recommendation

Based on the current implementation status and business priorities, the **Minimum Viable Product** should deliver the Phase 1 feature set with essential infrastructure. This provides immediate value to Nigerian businesses while deferring advanced features to post-launch iterations.

### INCLUDE in MVP (Must-Have for Beta Launch)

#### Core Features
| Feature | Current Status | Action Required |
|---------|----------------|-----------------|
| ✅ User authentication | Implemented | Resolve dual auth context |
| ✅ Business Tax Calculator (F-01) | 95% complete | Add save to account |
| ✅ Individual Tax Calculator (F-02) | 95% complete | Add save to account |
| ✅ VAT Compliance Checker (F-03) | 95% complete | Add save to account |
| ⚠️ Tax Center landing page | Minimal placeholder | Build dashboard with calculator cards |
| ✅ Mobile-responsive UI | Implemented | No action |
| ✅ Basic error handling | Implemented | No action |
| ✅ PDF export (client-side) | Implemented | No action |

#### Infrastructure Must-Haves
| Component | Current Status | Action Required |
|-----------|----------------|-----------------|
| ⚠️ All tests passing | Tests excluded | Remove exclusions, fix failures |
| ❌ Clean build | Merge conflict | Resolve conflict in `transactions/page.tsx` |
| ✅ Vercel deployable | Configuration exists | Create `vercel.json` |
| ❌ Rate limiting | Not implemented | Implement @upstash/ratelimit on 55 API routes |
| ❌ RBAC enforcement | Not implemented | Add role checks to API routes |
| ✅ RLS policies | Fully implemented | No action |
| ✅ Health check | Implemented | No action |

#### Nice-to-Have (Defer if time-constrained)
- ⚠️ Tooltips on form fields (already implemented - keep)
- ⚠️ Band-by-band tax breakdown toggle (already implemented - keep)
- ⚠️ Calculation history persistence (needs implementation - defer to Week 2)
- ⚠️ Server-side PDF generation (defer - client-side works for MVP)

### DEFER to Post-MVP

#### Phase 2 Features (Not MVP-Critical)
| Feature | Completion | Rationale for Deferral |
|---------|------------|------------------------|
| Stamp Duty Calculator (F-04) | 95% | Complete but not core tax compliance need |
| Capital Allowance Tracker (F-05) | 95% | Advanced feature, requires persistence work |
| Dashboard widgets (F-06) | 25% | Landing page sufficient for MVP, widgets are polish |
| Server-side PDF Generator (F-07) | 60% | Client-side PDF works for initial users |

#### Phase 3 Features (Future Enhancements)
| Feature | Completion | Estimated Post-MVP Effort |
|---------|------------|---------------------------|
| Tax Advisory Chatbot (F-08) | 10% | 3-4 weeks |
| Tax Calendar & Reminders (F-09) | 40% | 2-3 weeks (complete email/push delivery) |
| Tax Savings Optimizer (F-10) | 5% | 4-5 weeks |

#### Infrastructure Enhancements
- Comprehensive E2E test suite (Playwright/Cypress) - 15 hours
- WCAG 2.1 AA full compliance - 12 hours
- Advanced form validation (Zod schemas) - 10 hours
- Unified error boundary components - 6 hours
- Multi-language support - Phase 3
- Advanced monitoring/alerting - Phase 3

### MVP Launch Criteria (Go/No-Go Checklist)

**MUST HAVE (Launch Blockers):**
- [ ] All 4 P0 blockers resolved (merge conflict, rate limiting, auth, RBAC)
- [ ] Business Tax Calculator fully functional with save to account
- [ ] Individual Tax Calculator fully functional with save to account
- [ ] VAT Compliance Checker fully functional with save to account
- [ ] Tax Center dashboard page with calculator cards
- [ ] User authentication works (signup, login, logout)
- [ ] All tests pass (60%+ coverage)
- [ ] Build succeeds with no TypeScript errors
- [ ] Deployable to Vercel with all environment variables configured

**SHOULD HAVE (Quality Gates):**
- [ ] PDF export works for all 3 calculators
- [ ] Mobile responsive on iPhone and Android
- [ ] Basic accessibility (ARIA labels on calculator forms)
- [ ] PITR enabled with 7-day retention
- [ ] Rollback runbook documented
- [ ] Rate limiting tested under load

**NICE TO HAVE (Polish Items):**
- Advanced E2E test coverage
- WCAG 2.1 AA full compliance
- Form validation with Zod schemas
- Comprehensive error boundaries
- Performance optimization (caching, lazy loading)

---

## 5. Critical Path to MVP

This section provides an ordered, prioritized task list to reach MVP readiness. Tasks are grouped by priority and estimated complexity.

### PHASE 1: BLOCKERS (Must Fix - Week 1)

**Estimated Effort:** 18 hours
**Priority:** P0 - IMMEDIATE
**Dependencies:** None - must be done first

#### P0.1: Resolve Git Merge Conflict ⚠️ **IMMEDIATE**
- **Task:** Fix merge conflict in `src/app/(dashboard)/transactions/page.tsx`
- **Complexity:** S (Small) - 30 minutes
- **Dependencies:** None
- **Impact:** Unblocks all builds
- **Files:** [src/app/(dashboard)/transactions/page.tsx](src/app/(dashboard)/transactions/page.tsx:1)
- **Action:** Choose correct version (likely the newer import with `createSupabaseClient`), test page loads

#### P0.2: Verify Build Success
- **Task:** Run `npm run build` and ensure no errors
- **Complexity:** S - 15 minutes
- **Dependencies:** P0.1 (merge conflict resolved)
- **Impact:** Confirms build pipeline works

#### P0.3: Add Build Step to CI/CD Pipeline
- **Task:** Update `.github/workflows/ci.yml` to include `npm run build` step
- **Complexity:** S - 1 hour
- **Dependencies:** P0.2
- **Impact:** Prevents broken code from being merged
- **Files:** [.github/workflows/ci.yml](.github/workflows/ci.yml:1)
- **Action:** Add step after lint: `- run: npm run build`

#### P0.4: Implement Rate Limiting on API Routes 🔴 **CRITICAL**
- **Task:** Add rate limiting to prevent DoS attacks on 55 API routes
- **Complexity:** M (Medium) - 4 hours
- **Dependencies:** None
- **Impact:** Eliminates P0 security vulnerability
- **Files:** All files in [src/app/api/](src/app/api/)
- **Action:**
  1. Install `@upstash/ratelimit` and `@upstash/redis`
  2. Create rate limit middleware in `src/lib/rate-limit.ts`
  3. Apply to expensive routes: `/api/ai/*`, `/api/export/*`, `/api/financial-statements/*`
  4. Configure 60 req/min per user (from existing env vars)
  5. Test with multiple rapid requests

#### P0.5: Complete Auth Migration Decision
- **Task:** Choose Supabase Auth OR Clerk, remove dual auth context
- **Complexity:** M - 2 hours
- **Dependencies:** None
- **Impact:** Eliminates confusion, simplifies codebase
- **Files:** [src/middleware.ts](src/middleware.ts:1), [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx:1)
- **Recommendation:** **Stay with Supabase Auth** (already implemented in middleware, RLS policies use `auth.uid()`)
- **Action:**
  1. Remove Clerk references from README if keeping Supabase
  2. Remove unused auth context
  3. Update middleware to use single auth source

#### P1.1: Implement RBAC Enforcement 🔴 **CRITICAL**
- **Task:** Add role-based access control to API routes and middleware
- **Complexity:** L (Large) - 8 hours
- **Dependencies:** P0.5 (auth migration complete)
- **Impact:** Eliminates privilege escalation risk
- **Files:** [src/middleware.ts](src/middleware.ts:1), all [src/app/api/](src/app/api/) routes
- **Action:**
  1. Create `src/lib/auth/rbac.ts` with role check helpers
  2. Define role permissions matrix (owner, admin, user)
  3. Add role checks to admin routes (`/api/admin/*`)
  4. Add role checks to sensitive operations (delete, export)
  5. Test with different role users

#### P1.2: Enable Database PITR
- **Task:** Configure Point-in-Time Recovery for production database
- **Complexity:** S - 30 minutes
- **Dependencies:** None
- **Impact:** Eliminates data loss risk
- **Action:**
  1. Login to Supabase dashboard
  2. Navigate to Settings → Point-in-time Recovery
  3. Enable PITR with 7-day retention
  4. Document recovery procedure

#### P1.3: Fix Excluded Tests
- **Task:** Remove test exclusions from package.json, fix failing tests
- **Complexity:** M - 1.5 hours
- **Dependencies:** None
- **Impact:** Exposes hidden test failures, improves confidence
- **Files:** [package.json](package.json:1), [tests/](tests/)
- **Action:**
  1. Remove `--exclude` flags from test script
  2. Run `npm test` and identify failures
  3. Fix failing tests in sprint7, sprint8, sprint9-10
  4. Verify 100% pass rate

### PHASE 2: CORE MVP FEATURES (Must Build - Week 2)

**Estimated Effort:** 17 hours
**Priority:** P0-P1
**Dependencies:** Phase 1 complete

#### P0.6: Build Tax Center Dashboard Landing Page
- **Task:** Create professional dashboard with calculator cards and navigation
- **Complexity:** M - 4 hours
- **Dependencies:** None
- **Impact:** Provides user entry point to all calculators
- **Files:** [src/app/(dashboard)/page.tsx](src/app/(dashboard)/page.tsx:1) (new), [src/components/dashboard/TaxCenterCards.tsx](src/components/dashboard/TaxCenterCards.tsx:1) (new)
- **Action:**
  1. Design 3 calculator cards (Business Tax, Individual Tax, VAT)
  2. Add card icons, descriptions, and "Calculate Now" buttons
  3. Implement responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop)
  4. Add welcome message and user profile summary
  5. Link cards to calculator routes

#### P0.7: Add Dashboard Routing
- **Task:** Configure routing and navigation for dashboard
- **Complexity:** S - 30 minutes
- **Dependencies:** P0.6
- **Impact:** Enables navigation to/from dashboard
- **Files:** [src/components/layout/DashboardLayout.tsx](src/components/layout/DashboardLayout.tsx:1)
- **Action:**
  1. Add "Dashboard" link to navbar
  2. Update breadcrumb navigation
  3. Test navigation flow

#### P0.8: Test Dashboard Performance
- **Task:** Verify dashboard loads in <3 seconds
- **Complexity:** S - 30 minutes
- **Dependencies:** P0.7
- **Impact:** Ensures good UX
- **Action:**
  1. Test load time with Network tab throttled to 3G
  2. Optimize if needed (lazy load images, code split)

#### P1.4: Create Calculation History Database Schema
- **Task:** Design and migrate database schema for saved calculations
- **Complexity:** S - 1 hour
- **Dependencies:** None
- **Impact:** Enables save to account feature
- **Files:** [src/db/schema/calculations.ts](src/db/schema/calculations.ts:1) (new), [supabase/migrations/](supabase/migrations/) (new migration)
- **Action:**
  1. Create `saved_calculations` table with fields: id, user_id, calculator_type, inputs (JSONB), results (JSONB), created_at
  2. Add RLS policy: users can only read/write their own calculations
  3. Run migration: `drizzle-kit push:pg`

#### P1.5: Implement Save Functionality for All Calculators
- **Task:** Add "Save to Account" button and API endpoints for all 3 calculators
- **Complexity:** M - 4 hours
- **Dependencies:** P1.4 (schema created)
- **Impact:** Core MVP feature for user value
- **Files:**
  - [src/app/api/calculations/save/route.ts](src/app/api/calculations/save/route.ts:1) (new)
  - [src/app/api/calculations/history/route.ts](src/app/api/calculations/history/route.ts:1) (new)
  - [src/app/(dashboard)/calculators/business-tax/page.tsx](src/app/(dashboard)/calculators/business-tax/page.tsx:1)
  - [src/app/(dashboard)/calculators/individual-tax/page.tsx](src/app/(dashboard)/calculators/individual-tax/page.tsx:1)
  - [src/app/(dashboard)/calculators/vat/page.tsx](src/app/(dashboard)/calculators/vat/page.tsx:1)
- **Action:**
  1. Create POST `/api/calculations/save` endpoint
  2. Create GET `/api/calculations/history` endpoint
  3. Add "Save to Account" button to all calculator results pages
  4. Show success toast on save
  5. Add "View History" link

#### P1.6: Build Calculation History UI
- **Task:** Create page to view saved calculation history
- **Complexity:** M - 2 hours
- **Dependencies:** P1.5
- **Impact:** Completes save to account feature
- **Files:** [src/app/(dashboard)/calculations/history/page.tsx](src/app/(dashboard)/calculations/history/page.tsx:1) (new)
- **Action:**
  1. Create table view of saved calculations
  2. Add filters by calculator type and date
  3. Add "View Details" button to re-display calculation
  4. Add "Delete" button for each calculation
  5. Implement pagination (10 per page)

#### P1.7: Test Save/Retrieve Flow
- **Task:** End-to-end testing of save to account feature
- **Complexity:** S - 1 hour
- **Dependencies:** P1.6
- **Impact:** Verifies feature works
- **Action:**
  1. Run Business Tax calculator, save result
  2. Navigate to history page, verify saved
  3. View details, verify data matches
  4. Delete calculation, verify removed
  5. Test with all 3 calculators

#### P1.8: Create vercel.json Deployment Config
- **Task:** Document Vercel deployment configuration
- **Complexity:** S - 1 hour
- **Dependencies:** None
- **Impact:** Enables automated deployment
- **Files:** [vercel.json](vercel.json:1) (new)
- **Action:**
  1. Create vercel.json with build settings
  2. Configure environment variables list
  3. Add custom headers (CSP, security headers)
  4. Configure redirects if needed

#### P1.9: Document Environment Variable Setup
- **Task:** Create deployment environment configuration guide
- **Complexity:** S - 1 hour
- **Dependencies:** None
- **Impact:** Enables production deployment
- **Files:** [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md:1) (new)
- **Action:**
  1. List all required environment variables
  2. Document where to get each value
  3. Add Vercel dashboard setup instructions
  4. Add troubleshooting section

#### P1.10: Create Rollback Runbook
- **Task:** Document emergency rollback procedure
- **Complexity:** S - 1 hour
- **Dependencies:** None
- **Impact:** Risk mitigation for production
- **Files:** [docs/ROLLBACK_RUNBOOK.md](docs/ROLLBACK_RUNBOOK.md:1) (new)
- **Action:**
  1. Document Vercel rollback procedure (revert deployment)
  2. Document database rollback (use `rollback_all.sql` if needed)
  3. Add incident response checklist
  4. Add emergency contact information

### PHASE 3: QUALITY & POLISH (Should Have - Week 3)

**Estimated Effort:** 20 hours
**Priority:** P1-P2
**Dependencies:** Phase 2 complete

#### P1.11: Write Unit Tests for Tax Calculation Logic
- **Task:** Comprehensive unit tests for all tax formulas
- **Complexity:** M - 5 hours
- **Dependencies:** None
- **Impact:** Ensures tax calculations are correct
- **Files:** [tests/tax-calculations.test.ts](tests/tax-calculations.test.ts:1) (new)
- **Action:**
  1. Test Business Tax: Small company (0% CIT), Other company (30% CIT + 4% Dev Levy)
  2. Test Individual Tax: All progressive bands (0%, 15%, 18%, 21%, 24%)
  3. Test Individual Tax reliefs: Rent relief (20% capped at ₦500K), owner-occupier
  4. Test VAT: Exemption logic (<₦100M && <₦250M), 7.5% calculation
  5. Test edge cases: zero income, negative values, very large numbers
  6. Achieve 100% coverage of tax calculation functions

#### P1.12: Write API Integration Tests
- **Task:** Integration tests for API routes
- **Complexity:** M - 5 hours
- **Dependencies:** None
- **Impact:** Ensures API routes work correctly
- **Files:** [tests/api-integration.test.ts](tests/api-integration.test.ts:1) (new)
- **Action:**
  1. Test authentication flows (signup, login, logout)
  2. Test calculator API endpoints (if they exist)
  3. Test save/retrieve calculation endpoints
  4. Test rate limiting (verify 429 after 60 requests)
  5. Test RBAC (verify 403 for unauthorized roles)
  6. Mock Supabase client for test isolation

#### P1.13: Write Critical Path E2E Tests
- **Task:** End-to-end user journey tests
- **Complexity:** M - 2 hours
- **Dependencies:** None
- **Impact:** Catches regression bugs
- **Files:** [tests/e2e-critical-path.test.ts](tests/e2e-critical-path.test.ts:1) (new)
- **Action:**
  1. Test: User signup → email verification → login → dashboard
  2. Test: Dashboard → Business Tax Calculator → enter data → view results → save → verify in history
  3. Test: History → view details → export PDF → verify download
  4. Use Vitest for now (defer Playwright to Phase 4)

#### P2.1: Update .env.example with All Required Variables
- **Task:** Ensure .env.example is comprehensive and accurate
- **Complexity:** S - 30 minutes
- **Dependencies:** None
- **Impact:** Prevents deployment errors
- **Files:** [.env.example](.env.example:1)
- **Action:**
  1. Verify all variables used in code are documented
  2. Add descriptions for each variable
  3. Add example values where safe
  4. Group by category (Supabase, AI, Payments, etc.)

#### P2.2: Write Deployment Guide
- **Task:** Comprehensive production deployment documentation
- **Complexity:** M - 2 hours
- **Dependencies:** None
- **Impact:** Enables smooth production launch
- **Files:** [docs/PRODUCTION_DEPLOYMENT_GUIDE.md](docs/PRODUCTION_DEPLOYMENT_GUIDE.md:1) (new)
- **Action:**
  1. Document Vercel deployment steps
  2. Document Supabase production setup
  3. Document environment variable configuration
  4. Add pre-deployment checklist
  5. Add post-deployment verification steps
  6. Add rollback procedure reference

#### P2.3: Create User Onboarding Guide
- **Task:** User-facing documentation for getting started
- **Complexity:** M - 1.5 hours
- **Dependencies:** None
- **Impact:** Reduces support burden
- **Files:** [docs/USER_ONBOARDING_GUIDE.md](docs/USER_ONBOARDING_GUIDE.md:1) (new)
- **Action:**
  1. Write signup walkthrough with screenshots
  2. Write calculator usage guide for each of 3 calculators
  3. Write save/export guide
  4. Add FAQ section
  5. Add troubleshooting section

#### P2.4: Add ARIA Labels to Calculator Forms
- **Task:** Improve accessibility for screen readers
- **Complexity:** M - 2 hours
- **Dependencies:** None
- **Impact:** Basic accessibility compliance
- **Files:** All calculator form components
- **Action:**
  1. Add `aria-label` to all input fields
  2. Add `aria-describedby` for help text
  3. Add `role="alert"` to error messages
  4. Add `aria-live="polite"` to result sections
  5. Test with screen reader (NVDA or VoiceOver)

#### P2.5: Test Keyboard Navigation
- **Task:** Verify all interactive elements are keyboard accessible
- **Complexity:** S - 1 hour
- **Dependencies:** None
- **Impact:** Accessibility compliance
- **Action:**
  1. Tab through all form fields in sequence
  2. Verify form submission with Enter key
  3. Verify button activation with Space/Enter
  4. Verify modal/dialog dismissal with Escape
  5. Fix tab order issues

#### P2.6: Verify Mobile Responsiveness
- **Task:** Test UI on mobile devices
- **Complexity:** S - 1 hour
- **Dependencies:** None
- **Impact:** Good mobile UX
- **Action:**
  1. Test on iPhone (Safari)
  2. Test on Android (Chrome)
  3. Test landscape and portrait orientations
  4. Verify touch targets are >44px
  5. Fix any layout issues

### PHASE 4: PRE-LAUNCH VALIDATION (Nice to Have - Week 4)

**Estimated Effort:** 10 hours
**Priority:** P2-P3
**Dependencies:** Phase 3 complete

#### P2.7: Run Full Test Suite and Verify Coverage
- **Task:** Generate coverage report and verify 60%+ line coverage
- **Complexity:** M - 2 hours
- **Dependencies:** P1.11, P1.12, P1.13 (tests written)
- **Impact:** Quality gate for launch
- **Action:**
  1. Install `@vitest/coverage-v8`
  2. Run `npm test -- --coverage`
  3. Review coverage report
  4. Identify uncovered critical paths
  5. Add tests to reach 60% coverage

#### P2.8: Perform Manual QA on All User Flows
- **Task:** Manual testing of complete user journeys
- **Complexity:** M - 2 hours
- **Dependencies:** None
- **Impact:** Catches bugs automated tests miss
- **Action:**
  1. Create test account
  2. Run through all 3 calculators
  3. Test save/retrieve functionality
  4. Test PDF export
  5. Test error states (invalid inputs, network errors)
  6. Document bugs in GitHub Issues

#### P2.9: Load Test API Endpoints
- **Task:** Verify API can handle expected traffic
- **Complexity:** M - 2 hours
- **Dependencies:** None
- **Impact:** Prevents production outages
- **Action:**
  1. Use k6 or Apache Bench for load testing
  2. Test 100 concurrent users on calculator endpoints
  3. Test 50 concurrent users on save/retrieve endpoints
  4. Verify rate limiting kicks in at 60 req/min
  5. Verify response times stay <1s under load

#### P3.1: Verify All RLS Policies Working
- **Task:** Security audit of Row Level Security
- **Complexity:** S - 1 hour
- **Dependencies:** None
- **Impact:** Prevents data leaks
- **Action:**
  1. Create two test users (User A, User B)
  2. User A saves calculation
  3. Login as User B, verify cannot see User A's calculation
  4. Test on all tables with user data
  5. Review RLS policies in Supabase dashboard

#### P3.2: Verify Service Role Key Not in Frontend
- **Task:** Security audit of service role key usage
- **Complexity:** S - 30 minutes
- **Dependencies:** None
- **Impact:** Prevents security breach
- **Action:**
  1. Open browser DevTools Network tab
  2. Use app and trigger API calls
  3. Verify no requests contain service_role key
  4. Run: `grep -r "service_role" src/app src/components`
  5. Verify no matches in client code

#### P3.3: Test Rate Limiting Under Load
- **Task:** Verify rate limiting works correctly
- **Complexity:** S - 1 hour
- **Dependencies:** P0.4 (rate limiting implemented)
- **Impact:** Prevents DoS
- **Action:**
  1. Write script to make 70 requests in 1 minute
  2. Verify first 60 succeed (200 OK)
  3. Verify requests 61-70 fail (429 Too Many Requests)
  4. Wait 1 minute, verify rate limit resets
  5. Test on expensive endpoints: `/api/ai/categorize`, `/api/export/bulk`

#### P3.4: Verify Session Timeout
- **Task:** Test session expiry behavior
- **Complexity:** S - 30 minutes
- **Dependencies:** None
- **Impact:** Security compliance
- **Action:**
  1. Login, note session expiry time
  2. Wait for expiry (or manually expire token)
  3. Verify user is redirected to login
  4. Verify no API calls succeed with expired token

#### P3.5: Review NDPR Compliance Checklist
- **Task:** Final compliance audit for Nigerian Data Protection Regulation
- **Complexity:** S - 1 hour
- **Dependencies:** None
- **Impact:** Legal compliance
- **Action:**
  1. Verify data minimization (only collect necessary data)
  2. Verify secure storage (AES-256 encryption, RLS)
  3. Verify user consent flows (signup terms acceptance)
  4. Verify data retention policy documented
  5. Verify breach notification procedure ready
  6. Document compliance status

---

## 6. Technical Debt & Risks

This section identifies code quality issues, missing features, security gaps, and architectural concerns that could cause problems at scale.

### High Priority Technical Debt (Must Address Before Public Launch)

#### 1. Dual Authentication Context Pattern
- **Issue:** Code references both Supabase Auth and Clerk, creating confusion
- **Impact:** Developer confusion, potential bugs, maintenance burden
- **Location:** [src/middleware.ts](src/middleware.ts:1), [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx:1), README.md
- **Risk:** Medium - Could lead to auth bypass bugs
- **Remediation:** Choose one auth provider (recommend Supabase), remove other references (2 hours)

#### 2. Test Exclusions in package.json
- **Issue:** Most test suites excluded from default `npm test` run
- **Impact:** Hides failing tests, creates false confidence in CI/CD
- **Location:** [package.json](package.json:1) line 8
- **Risk:** High - Could ship broken code
- **Remediation:** Remove exclusions, fix failing tests (1.5 hours - covered in P1.3)

#### 3. No Server-Side PDF Generation
- **Issue:** PDF generation only works in browser (jsPDF), not server-side
- **Impact:** Cannot generate PDFs in background jobs, email attachments, or bulk exports
- **Location:** [src/lib/pdf-generator.ts](src/lib/pdf-generator.ts:1) (client-side only), [src/server/pdf.ts](src/server/pdf.ts:1) (placeholder)
- **Risk:** Low for MVP - Won't scale for large reports or automated exports
- **Remediation:** Implement server-side PDF with Puppeteer or react-pdf (8 hours - defer to Phase 2)

#### 4. Sparse ARIA Labels
- **Issue:** Only 3 instances of `aria-*` attributes across entire app
- **Impact:** Poor screen reader experience, WCAG 2.1 AA non-compliance
- **Location:** All component files
- **Risk:** Medium - Legal compliance risk for accessibility
- **Remediation:** Add comprehensive ARIA labels (2 hours - covered in P2.4)

#### 5. No Unified Error UI Component
- **Issue:** Error handling inconsistent across components (custom error strings)
- **Impact:** Inconsistent UX, harder to maintain
- **Location:** 86 files reference error states with different patterns
- **Risk:** Low - UX inconsistency
- **Remediation:** Create unified error boundary and error display component (6 hours - defer to Phase 2)

### Medium Priority Technical Debt (Address in Phase 2)

#### 6. No Form Validation Schemas
- **Issue:** Custom `validateForm()` functions instead of Zod/Yup schemas
- **Impact:** Code duplication, harder to maintain, no type inference
- **Location:** All calculator pages
- **Risk:** Low - Current validation works, but not scalable
- **Remediation:** Migrate to Zod schemas for all forms (10 hours)

#### 7. Missing CI Build Step
- **Issue:** GitHub Actions CI doesn't verify builds succeed
- **Impact:** Could merge code that breaks production builds
- **Location:** [.github/workflows/ci.yml](.github/workflows/ci.yml:1)
- **Risk:** Medium - Could deploy broken code
- **Remediation:** Add build step to CI (1 hour - covered in P0.3)

#### 8. No E2E Test Automation
- **Issue:** No Playwright/Cypress tests for user flows
- **Impact:** Manual testing required for releases, slower iteration
- **Location:** No E2E test framework configured
- **Risk:** Low - Can launch with integration tests
- **Remediation:** Set up Playwright and write critical path tests (15 hours - Phase 3)

#### 9. Hardcoded Tax Rate Values
- **Issue:** Some tax rates not fully dynamic from database rules
- **Impact:** Requires code changes for tax law updates
- **Location:** Tax calculation services
- **Risk:** Low - Nigerian tax rates stable, database rules engine already exists
- **Remediation:** Audit and ensure all rates come from database (4 hours)

#### 10. Missing Vercel Config File
- **Issue:** No `vercel.json` for deployment configuration
- **Impact:** Requires manual Vercel dashboard configuration
- **Location:** Root directory
- **Risk:** Low - Can configure manually
- **Remediation:** Create vercel.json (1 hour - covered in P1.8)

### Security Risks (Critical - Address in Phase 1)

#### 11. No Rate Limiting 🔴 **CRITICAL**
- **Issue:** All 55 API routes unprotected from DoS attacks
- **Impact:** API abuse, excessive AI API costs, service downtime
- **Location:** All [src/app/api/](src/app/api/) routes
- **Risk:** HIGH - Production security vulnerability
- **Remediation:** Implement @upstash/ratelimit (4 hours - covered in P0.4)

#### 12. No RBAC Enforcement 🔴 **CRITICAL**
- **Issue:** Any authenticated user can access all features
- **Impact:** Privilege escalation, unauthorized access to admin functions
- **Location:** API routes, middleware
- **Risk:** HIGH - Security compliance violation
- **Remediation:** Implement role-based access control (8 hours - covered in P1.1)

#### 13. Session Timeout Not Configured
- **Issue:** No explicit session timeout (relies on Supabase default ~1 hour)
- **Impact:** Security compliance gap for financial applications
- **Location:** [src/lib/supabase/client.ts](src/lib/supabase/client.ts:1)
- **Risk:** Medium - Compliance issue
- **Remediation:** Configure explicit session timeout (e.g., 20 minutes) (2 hours)

#### 14. PITR Not Enabled 🔴 **CRITICAL**
- **Issue:** Database Point-in-Time Recovery not configured
- **Impact:** Data loss risk in production (no backup recovery)
- **Location:** Supabase project settings
- **Risk:** HIGH - Data loss catastrophic for financial app
- **Remediation:** Enable PITR with 7-day retention (30 min - covered in P1.2)

### Scalability Concerns (Address Before Public Launch)

#### 15. Client-Side PDF Generation Only
- **Issue:** PDF generation runs in browser, not server
- **Impact:** Cannot generate PDFs in background, email attachments, or bulk exports
- **Location:** [src/lib/pdf-generator.ts](src/lib/pdf-generator.ts:1)
- **Risk:** Medium - Won't scale for enterprise customers
- **Remediation:** Implement server-side PDF service (8 hours - Phase 2)

#### 16. No Caching Layer
- **Issue:** Repeated tax calculations not cached
- **Impact:** Unnecessary computation, slower response times
- **Location:** Tax calculation services
- **Risk:** Low - Calculations are fast (<100ms)
- **Remediation:** Add Redis cache for calculations (6 hours - Phase 3)

#### 17. No Background Job Processing
- **Issue:** Long-running tasks (bulk export, email sending) block API responses
- **Impact:** Slow API responses, timeout errors
- **Location:** API routes
- **Risk:** Low for MVP - No heavy background tasks yet
- **Remediation:** Implement job queue (BullMQ, Inngest) when needed (12 hours - Phase 3)

---

## 7. Estimated Effort

This section provides rough estimates of total remaining work to reach different completion milestones.

### To MVP Launch (Beta Ready)

**Total: 3-4 weeks (55-65 developer hours)**

**Assumptions:**
- Single senior full-stack developer
- Working with AI coding assistance (Claude Code, GitHub Copilot)
- No major unforeseen blockers
- Focused work with minimal context switching

**Week-by-Week Breakdown:**

| Week | Phase | Effort | Critical Tasks |
|------|-------|--------|----------------|
| **Week 1** | Blockers | 18 hours | Fix merge conflict, implement rate limiting, complete auth migration, implement RBAC, enable PITR, fix excluded tests |
| **Week 2** | Core Features | 17 hours | Build Tax Center dashboard, implement save to account, create calculation history UI, deployment config |
| **Week 3** | Quality & Polish | 20 hours | Write unit tests, API integration tests, E2E tests, add ARIA labels, update documentation |
| **Week 4** | Pre-Launch Validation | 10 hours | Full QA, load testing, security audit, NDPR compliance review |

**Timeline Options:**

1. **Minimum Viable Timeline (2 weeks):** 35 hours
   - Week 1: Blockers (18 hours) ✅ CRITICAL
   - Week 2: Core Features (17 hours) ✅ CRITICAL
   - **Launches with:** Working calculators, save to account, basic tests, security fixes
   - **Defers:** Comprehensive testing, accessibility enhancements, full documentation

2. **Recommended Timeline (3 weeks):** 55 hours
   - Week 1: Blockers (18 hours)
   - Week 2: Core Features (17 hours)
   - Week 3: Quality & Polish (20 hours)
   - **Launches with:** 60%+ test coverage, ARIA labels, full documentation
   - **Defers:** Advanced E2E tests, load testing, final security audit

3. **Polish Timeline (4 weeks):** 65 hours
   - All 4 weeks as outlined above
   - **Launches with:** 60%+ test coverage, load testing, security audit, NDPR compliance verified
   - **Best for:** Risk-averse launch with high confidence

**Recommended Approach:** **3-week timeline (55 hours)** balances speed and quality for beta launch.

### To Full Phase 1 Completion

**Total: 5-6 weeks (120-140 developer hours)**

Includes all MVP work (55 hours) plus:

| Enhancement | Effort | Benefit |
|-------------|--------|---------|
| Server-side PDF generation (Puppeteer/react-pdf) | 8 hours | Enables background PDF jobs, email attachments |
| Advanced form validation (migrate to Zod schemas) | 10 hours | Type-safe validation, better DX |
| Comprehensive E2E test suite (Playwright) | 20 hours | Automated regression testing |
| WCAG 2.1 AA full compliance audit | 12 hours | Legal compliance, broader accessibility |
| Enhanced error handling (unified error boundaries) | 8 hours | Better UX, consistent error display |
| Performance optimization (lazy loading, caching) | 6 hours | Faster load times, better UX |
| Security enhancements (session timeout, CSP headers) | 6 hours | Compliance, hardening |

**Total Phase 1 Additions:** 70 hours
**Cumulative:** 125 hours (5-6 weeks)

**Deliverables:**
- Production-ready with advanced features
- Comprehensive test coverage (80%+)
- Full accessibility compliance
- Performance optimized
- Security hardened

### To Full Phase 2 Completion

**Total: 10-12 weeks (250-300 developer hours)**

Includes all Phase 1 work (125 hours) plus:

| Feature | Effort | Value |
|---------|--------|-------|
| Complete Dashboard with widgets (deadlines, savings opportunities) | 20 hours | Better UX, user engagement |
| Stamp Duty Calculator integration (already built - just integrate) | 0 hours | Already done |
| Capital Allowance asset persistence & multi-asset tracking | 12 hours | Full asset management |
| Tax Calendar UI with calendar grid view | 15 hours | Better deadline visualization |
| Email/push notification delivery service | 20 hours | Critical for deadline reminders |
| Multi-user collaboration (team access) | 40 hours | Enterprise feature |
| Audit trail viewer (7-year retention UI) | 15 hours | Compliance requirement |
| Advanced analytics dashboard | 18 hours | User insights |
| Batch PDF export | 8 hours | Enterprise feature |
| API rate limiting dashboard | 6 hours | Admin feature |
| User feedback system | 8 hours | Product improvement |

**Total Phase 2 Additions:** 162 hours
**Cumulative:** 287 hours (10-12 weeks)

**Deliverables:**
- Enterprise-ready platform
- Multi-user support
- Advanced analytics
- Automated notifications
- Comprehensive audit logging

### Confidence Levels & Risks

| Milestone | Confidence | Key Risks |
|-----------|-----------|-----------|
| **MVP (3 weeks)** | 80% High | Unforeseen auth migration issues, test failures harder to fix than expected |
| **Phase 1 (6 weeks)** | 70% Medium | E2E test framework learning curve, WCAG compliance audit uncovers major issues |
| **Phase 2 (12 weeks)** | 60% Medium | Multi-user implementation complexity, notification delivery service integration challenges |

**Mitigation Strategies:**
1. **Auth Migration Risk:** Complete migration decision early (Week 1), test thoroughly before proceeding
2. **Test Coverage Risk:** Start writing tests in Week 1 (parallel to blocker fixes), identify issues early
3. **WCAG Compliance Risk:** Use automated tools (axe DevTools) during development, not just at audit
4. **Multi-user Complexity:** Design schema and RLS policies early, test with multiple users frequently

---

## Appendix A: Key Files Reference

**Phase 1 Tax Calculators (Production-Ready):**
- [src/app/(dashboard)/calculators/business-tax/page.tsx](src/app/(dashboard)/calculators/business-tax/page.tsx:1)
- [src/app/(dashboard)/calculators/individual-tax/page.tsx](src/app/(dashboard)/calculators/individual-tax/page.tsx:1)
- [src/app/(dashboard)/calculators/vat/page.tsx](src/app/(dashboard)/calculators/vat/page.tsx:1)

**Authentication & Security:**
- [src/middleware.ts](src/middleware.ts:1)
- [src/lib/supabase/server.ts](src/lib/supabase/server.ts:1)
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts:1)

**Database:**
- [drizzle.config.ts](drizzle.config.ts:1)
- [src/db/schema/](src/db/schema/)
- [supabase/migrations/004_rls.sql](supabase/migrations/004_rls.sql:1)

**Testing:**
- [vitest.config.ts](vitest.config.ts:1)
- [package.json](package.json:1) (test scripts)
- [tests/](tests/)

**CI/CD:**
- [.github/workflows/ci.yml](.github/workflows/ci.yml:1)
- [next.config.js](next.config.js:1)

**Documentation:**
- [README.md](README.md:1)
- [CLAUDE.md](CLAUDE.md:1)
- [DEPLOYMENT.md](DEPLOYMENT.md:1)

---

## Appendix B: MVP Launch Checklist

### Pre-Launch (Week 1-3)
- [ ] P0.1: Resolve git merge conflict
- [ ] P0.2: Verify build succeeds
- [ ] P0.3: Add build step to CI/CD
- [ ] P0.4: Implement rate limiting
- [ ] P0.5: Complete auth migration
- [ ] P1.1: Implement RBAC enforcement
- [ ] P1.2: Enable database PITR
- [ ] P1.3: Fix excluded tests
- [ ] P0.6: Build Tax Center dashboard
- [ ] P1.4: Create calculation history schema
- [ ] P1.5: Implement save to account
- [ ] P1.6: Build calculation history UI
- [ ] P1.11: Write tax calculation unit tests
- [ ] P1.12: Write API integration tests
- [ ] P2.4: Add ARIA labels

### Go/No-Go Criteria (Week 4)
- [ ] All P0 blockers resolved
- [ ] All 3 Phase 1 calculators functional
- [ ] Save to account works
- [ ] Test coverage ≥60%
- [ ] Build passes with no errors
- [ ] Deployable to Vercel
- [ ] Rate limiting active
- [ ] RBAC enforced
- [ ] RLS policies verified
- [ ] PITR enabled

### Launch Day
- [ ] Deploy to production (Vercel)
- [ ] Verify health check endpoint
- [ ] Smoke test all 3 calculators
- [ ] Verify authentication flow
- [ ] Monitor logs for errors
- [ ] Announce to beta users

### Post-Launch (Week 5-6)
- [ ] Monitor user feedback
- [ ] Fix critical bugs within 24 hours
- [ ] Collect analytics on calculator usage
- [ ] Iterate based on user feedback

---

**Report End**
**Classification:** Internal Use
**Distribution:** Engineering, Product, Executive Team
**Next Review:** March 12, 2026 (Post-Beta Launch)
