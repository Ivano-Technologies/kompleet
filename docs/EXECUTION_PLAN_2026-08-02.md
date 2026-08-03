# KOMPLEET — Completion Review & Next-Level Execution Plan

**Date:** 2026-08-02
**Repo HEAD:** `e32b6b000` (`main` == `staging`)
**Basis:** live verification (Supabase advisors, Vercel API, repo inspection) — supersedes `docs/AUDIT_STATUS_2026-07-15.md`

---

## 1. Where the platform actually stands

### Closed since the 15 July audit

| July P0/P1 | Status now | Evidence |
| --- | --- | --- |
| Main CI `build` red (audit gate JSON parse) | **CLOSED** | `f4f33e2fc` + `3499a8ebd`; `audit-ci.mjs` on npm bulk endpoint, xlsx on SheetJS 0.20.3 tarball, GHSA exceptions dropped |
| Vercel prod build failing (Supabase env at prerender) | **CLOSED** | `dpl_F4YYUFy9T8EF8G6UhrvEUFKZaJYt` — `target: production`, `READY`, main @ `e32b6b000` |
| Vercel private-org / Hobby deploy blocker | **CLOSED — but see 2.1** | Resolved by flipping the repo to **public**, not by upgrading the plan |
| Supabase 52 security lints | **CLOSED** | `get_advisors(security)` → **0 lints**; six migrations mirrored in `supabase/migrations` |
| Supabase 132 performance lints | **CLOSED** | `get_advisors(performance)` → **0 lints** |
| Branch sprawl (11 stale remotes) | **CLOSED** | Only `main` + `staging` remain |
| Migration drift local↔prod | **CLOSED** | Six 2026-07-15/16 migrations committed, names match `list_migrations` |

### Honest completion estimate

| Dimension | Level |
| --- | --- |
| Feature surface (36 API groups, 17 dashboard routes, calculators, OCR, e-invoicing, ML governance) | ~90% |
| Engineering hygiene (499 tests, typecheck, pinned actions, CodeQL, audit gate) | ~85% |
| Database security posture | ~95% |
| **Production/launch readiness** | **~45%** |
| **Operational readiness (runtime SLOs, on-call, backups verified)** | **~30%** |

**Verdict:** the codebase is close to done. The *product* is not launched. The gap is no longer code quality — it is exposure, go-to-market surface, and runtime confidence. Plan the next phase around those three, not around features.

---

## 2. Top next-level improvements, ranked

### 2.1 — P0 · Repo went public; rotate and re-close

Vercel deployment metadata flipped from `githubRepoVisibility: "private"` (March) to `"public"` (July/August). The Hobby-plan deploy blocker was solved by publishing a fintech codebase, and a live credential is tracked in it.

**Confirmed exposure:**

- `.gdrive-rclone.ini` — a full Google Drive OAuth **refresh + access token** with `scope = drive`, committed at repo root. Access token expiry is stale, but the grant may still be live.
- `apps/mobile/google-services.json` — Firebase config for `kompleet-e3c66` (low severity alone; meaningful in aggregate).
- `SUPABASE_FULL_AUDIT.sql`, `THREAT_MODEL.md`, `docs/INCIDENT_RESPONSE.md`, full RLS migration history — an attacker's map of the authorization model.
- Root `.gitignore` has `/google-services.json` (root-anchored) but the file lives at `apps/mobile/`, so the ignore never applied.

**Execution:**

1. Revoke the Google Drive grant in the Google account's third-party access panel — today, before anything else.
2. Decide plan vs. visibility. Vercel Pro is ~$20/seat/mo. Publishing the repo to save it is not a trade a tax platform should make. Upgrade `techivano` to Pro, flip the repo private.
3. Purge `.gdrive-rclone.ini` from history (`git filter-repo`), force-push, re-fix `.gitignore` to `**/google-services.json`.
4. Rotate anything else that touched the public window: Supabase service-role key, `OPENAI_API_KEY`, `SENTRY_AUTH_TOKEN`, Resend, Mono.
5. Add a secret-scanning gate (gitleaks or `trufflehog` pre-commit + CI job) so this class of leak fails the build rather than shipping.

**Gate:** repo private · credential revoked · secret scan green on full history.

---

### 2.2 — P0 · There is still no product URL

`live: false` on project `kompleet`. Domains attached are `ivanotechnologies.com`, `www.ivanotechnologies.com`, and two `*.vercel.app` aliases. `kompleet.ng` — the domain hard-coded as `NEXT_PUBLIC_SITE_URL` in CI — is attached nowhere. Production deploys succeed and then serve nothing anyone can be told to visit.

**Execution:**

1. Decide canonical host: `kompleet.ng` (product) vs `ivanotechnologies.com` (company). Recommend `app.kompleet.ng` for the product and marketing on `kompleet.ng`.
2. Register/renew `kompleet.ng`, point DNS at Vercel, attach domain, verify SSL, set apex→www (or reverse) redirect.
3. Set `NEXT_PUBLIC_SITE_URL` per-environment on the Vercel project — remove the hard-coded value from `ci.yml`.
4. Update Supabase Auth redirect allowlist, OAuth consent screens, email template links, and `src/lib/cors.ts` prod allowlist to the real host.
5. Promote the current main deployment to production alias; confirm `live: true`.

**Gate:** canonical URL returns 200 with valid cert · signup email link lands on the right host · `live: true`.

---

### 2.3 — P0 · Dependabot has re-opened a 10-PR wall, and one already breaks the build

CI is green again, so bots resumed. PRs #45–54 are open, and they are not routine:

| PR | Bump | Risk |
| --- | --- | --- |
| #47 | `archiver` 7→8 (+ types) | **Deploy ERRORed** (`dpl_9piK1uV1bANfykX1TmM31WSaNjXy`) |
| #51 | `lucide-react` 0.563→1.25 | Major — icon API/name churn across the UI |
| #45 / #53 | `expo-file-system` 19→57, `expo-updates` 29→57 | Mobile majors — separate session |
| #48 | `@supabase/supabase-js` 2.99→2.110 | Auth/SSR surface; needs auth smoke |
| #46, #50, #52, #54 | postcss, jspdf-autotable, autoprefixer, recharts | Safe minors/patches |

**Execution:**

1. Group-merge the four safe ones today.
2. Take `supabase-js` alone with a manual auth + RLS smoke pass.
3. Diagnose #47's build failure before touching the major — pull the deployment build logs first, don't guess.
4. Quarantine the three majors (`lucide-react`, both Expo) into a dedicated branch; `lucide-react` v1 needs a full visual regression against `docs/source-of-truth.md`.
5. Configure `dependabot.yml` grouping (`patch`+`minor` batched weekly, majors individually) so this wall stops rebuilding itself every three weeks.

**Gate:** ≤3 open Dependabot PRs, all majors with an owner and a decision.

---

### 2.4 — P1 · CI proves less than it appears to

Three jobs run: `lint`, `test`, `build`. The gaps matter more than the coverage:

- **`typecheck` never runs in CI.** The script exists in `package.json` and is in the `precommit` hook, but no CI job calls it. Husky is bypassable with `--no-verify`, and Dependabot commits never run it at all.
- **Playwright never runs in CI.** `e2e/` contains exactly **one** spec (`auth-layout.spec.ts`) against a platform with auth, uploads, OCR, calculators, and filing. `playwright.config.ts` is configured and unused.
- **CI only triggers on `main`.** A `staging` branch now exists with zero pipeline attached to it — it is a label, not an environment.
- **No coverage threshold.** 499 tests is a count, not a floor; nothing prevents it drifting down.
- **OSV scan is `continue-on-error: true`** — advisory only, cannot fail a build.

**Execution:**

1. Add a `typecheck` job to `ci.yml` (cheapest high-value change in the repo).
2. Add `push: [staging]` and `pull_request: [main, staging]` triggers; wire staging to a Vercel preview environment with its own Supabase branch.
3. Write five E2E specs covering the actual money paths: signup→verify→login · bank statement upload→parse→categorize · run a tax calculation→save→retrieve from history · expense OCR→review queue · export PDF/Excel. Run against the staging URL post-deploy.
4. Add `vitest --coverage` with a floor at current measured coverage; ratchet upward, never down.
5. Once the dependency backlog is clear, promote OSV to blocking.

**Gate:** typecheck + coverage floor + 5 E2E specs green on both `main` and `staging`.

---

### 2.5 — P1 · Runtime observability is instrumented but not operationalized

Sentry is wired (`instrumentation-client.ts`, `sentry.server.config.ts`), source maps are disabled, and `docs/observability-release-dashboard.md` exists. What's missing is anything that pages a human: no alert rules, no error-rate SLO, no uptime check on the health endpoint, no verified PITR restore.

**Execution:**

1. Sentry alert rules — new-issue and error-rate-spike → email/Slack.
2. Uptime monitor on `/api/health` at 1-minute interval against the canonical domain.
3. Define three SLOs: availability, p95 API latency, calculation error rate. Put them in `docs/governance.md`.
4. **Execute** a PITR restore into a scratch project and time it. `docs/DATABASE_PITR_GUIDE.md` documents a procedure nobody has run.
5. Dry-run `docs/ROLLBACK_PLAYBOOK.md` end to end.

**Gate:** an induced 500 reaches a human within 5 minutes · a timed, successful restore is recorded.

---

### 2.6 — P1 · Legacy auth model and disabled billing are undeclared launch risk

- Migrations still carry `clerk_users`, `get_clerk_user_id()` and related paths while the app runs on Supabase Auth. Dual-identity code is exactly where authorization bugs hide, and the RLS work just landed on top of it.
- `src/app/api/expenses/billing/checkout/route.ts` is disabled pending legal review. Acceptable for beta; a launch blocker if unstated.
- `docs/PROJECT_STATUS_SUMMARY.md` (62%, blocked) and `docs/MVP_LAUNCH_READINESS_REPORT.md` ("READY") are both February-dated and contradict each other. `START_HERE.md` still points at a Feb 11 deploy path and quotes "128/134 tests" against a real 499.

**Execution:**

1. Grep every `clerk_*` reference; confirm dead; write one migration dropping the objects; add a test asserting no dual-identity path resolves.
2. Write the billing decision down — beta is free, revenue model and legal gate dated — in the launch checklist.
3. Delete or `docs/archive/` the contradicting Feb status docs. Make one status doc canonical and date-stamped.
4. Rewrite `START_HERE.md` as a real onboarding entry point, not a stale deploy runbook.

---

### 2.7 — P2 · Small correctness items found in passing

- `next.config.mjs` declares `async redirects()` **twice**. The second wins silently, so `/dashboard/overview` is a temporary (302) redirect while the first block intends permanent (301). Delete the duplicate and pick one.
- `experimental: { cpus: 1, workerThreads: false }` serializes builds — likely a workaround for the old Sentry/edge crash. Retest whether it's still needed; build time is developer throughput.
- Mobile AAB dates to 2026-03-04. Rebuild against the real production API and CORS once 2.2 lands.
- `audit-out.json` (66KB), `ts-errors.txt`, `tsconfig.tsbuildinfo`, `sandbox.txt`, `test-sprint7.js` are build detritus at repo root. Gitignore or delete.

---

## 3. Suggested sequencing

| Sprint | Theme | Contents | Exit criterion |
| --- | --- | --- | --- |
| **0 — this week** | Stop the bleeding | 2.1 in full; safe Dependabot merges from 2.3 | Repo private, token revoked, history purged, secret scan in CI |
| **1** | Make it reachable | 2.2 domain + env + auth redirects; promote to production alias | A URL exists that a beta user can be given |
| **2** | Make it trustworthy | 2.4 CI hardening; staging pipeline; 5 E2E specs; finish 2.3 | Both branches gated on typecheck + E2E |
| **3** | Make it operable | 2.5 alerts, SLOs, timed PITR restore, rollback dry-run | An induced failure pages someone in <5 min |
| **4** | Clear the decks | 2.6 clerk removal, doc truth-up, billing decision; 2.7 cleanups; mobile rebuild | One canonical status doc; no dead auth paths |

**Critical path:** 2.1 → 2.2. Everything else can parallelize. Do not start feature work until sprint 1 closes — the platform's constraint is that it cannot be visited, not that it lacks capability.

---

## 4. Decisions needed from Kezie

1. **Vercel Pro (~$20/seat/mo) so the repo can go private again — yes or no?** This gates 2.1 and it is the single highest-value call in this document.
2. **Canonical domain:** `app.kompleet.ng` (recommended) vs `kompleet.ng` vs staying on `ivanotechnologies.com`.
3. **`lucide-react` v1:** absorb the major now, or pin to 0.563 and defer past launch?
4. **Beta scope:** invite-only with billing disabled, or hold launch until the legal review on payments closes?
