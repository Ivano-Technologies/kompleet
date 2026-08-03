# KOMPLEET Platform — Full Status Audit

**Date:** 2026-07-15  
**Auditor:** Cursor (Grok) — live verification, not docs-only  
**Repo:** `Ivano-Technologies/KOMPLEET-PLATFORM` @ `dd53b54ed` (`main`)  
**Audience:** Claude (planning / verification) + Kezie (decision)

---

## Executive verdict

**Codebase quality is healthy. Production readiness is not.**

Local engineering gates are green (499/499 tests, typecheck clean, CodeQL clean, July-5 security hygiene landed).  
**Shipping is blocked:** Vercel cannot reliably deploy this private org repo on Hobby, the latest production deploy **ERROR**ed, `kompleet.ng` does not resolve, and **main CI `build` is red** because the security-audit gate is broken.

Treat this as a **deploy + infra emergency**, not a feature-build sprint.

---

## Scorecard (live)

| Area | Status | Evidence |
| --- | --- | --- |
| Unit/integration tests | PASS | `pnpm test` → **499/499** (49 files), ~217s |
| Typecheck | PASS | `pnpm typecheck` exit 0 |
| Local security gate | PASS* | `pnpm audit:ci` passed locally (*see CI caveats) |
| CodeQL (scheduled) | PASS | Latest success 2026-07-13 |
| Main CI `lint` / `test` | PASS | On latest main push |
| Main CI `build` | **FAIL** | Security gate: pnpm audit JSON parse error |
| Vercel production | **NOT LIVE** | Both projects `live: false` |
| Latest deploy (`kompleet-platform`) | **ERROR** | `pnpm build` failed — missing Supabase env at prerender |
| Custom domain `kompleet.ng` | **DOWN** | DNS NXDOMAIN / name not resolved |
| Serving domain today | Partial | `ivanotechnologies.com` + `kompleet-techivano.vercel.app` return 200 (stale main, not July-5 code) |
| Supabase project `KOMPLEET` | Healthy | `ACTIVE_HEALTHY`, eu-west-1, Postgres 17 |
| Mobile AAB | Stale | `Builds/kompleet-v1.aab` dated **2026-03-04** |
| Open Dependabot PRs | 10, blocked | All fail same CI `build` gate |
| Planning docs in-repo | Stale | Status/MVP docs last updated Feb 2026 — **do not trust for decisions** |

\*Local `pnpm audit` registry endpoint also returns 410 on raw `pnpm audit --json`; the custom `audit-ci.mjs` path succeeded locally but fails on GitHub Actions (truncated/unterminated JSON).

---

## P0 — Immediate attention (this week)

### 1. Vercel plan / private-org deploy blocker

**Symptom:** Commit status:  
`Cannot deploy from a private GitHub organization repository on the Hobby plan`  
(`upgradeToPro=github-private-org-to-hobby`)

**Impact:** Git-connected deploys from `Ivano-Technologies/*` fail. CLI deploy of July-5 main also ERROR’d.

**Action for Kezie:** Upgrade Vercel team **techivano** to Pro (or make repo public — not recommended), then reconnect one canonical project.

**Claude/Cursor follow-up:** Consolidate duplicate Vercel projects (`kompleet` vs `kompleet-platform`) after plan upgrade — keep one source of truth.

---

### 2. Production build broken — missing Supabase env during SSG

**Deployment:** `dpl_BGqWxi3tfdjDmnymnkr98MEH3RE8` (2026-07-05)  
**Error:** prerender `/calculators/business-tax` →  
`Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.`

Secondary build noise (non-fatal until env fixed):
- `natural` → `sylvester` → missing optional `lapack`
- `bullmq` critical dependency warning pulled into API route graph

**Action:**
1. Ensure `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and other required secrets) are set on the **active** Vercel project for Production + Preview.
2. Harden calculator pages so build does not crash when env is absent (lazy client init / dynamic = force-dynamic where needed).
3. Re-run production deploy; smoke auth + calculators + upload.

---

### 3. Main CI `build` job is red (blocks Dependabot + confidence)

**Root cause (confirmed from failed run logs):**  
`scripts/audit-ci.mjs` → `Failed to parse pnpm audit JSON output` / `SyntaxError: Unterminated string`  
Triggered by npm retiring the classic audit endpoint (local raw audit → HTTP 410).

**Also latent:** `ALLOWED_GHSA` exceptions for `xlsx` (`GHSA-4r6h-8v6p-xvw6`, `GHSA-5pgg-2g8v-p4x9`) **expired 2026-06-01**. Once JSON parse works, these become **blocking** unless renewed or `xlsx` replaced/vendored from SheetJS CDN.

**Action (Cursor prompt-ready):**
1. Rewrite `audit-ci.mjs` to use a supported advisory source (OSV already in CI with `continue-on-error: true` — promote it, or use `pnpm audit` bulk endpoint / `npm audit` replacement).
2. Decide on `xlsx`: migrate to maintained SheetJS build **or** explicitly renew exception with owner sign-off + expiry.
3. Confirm `pnpm build` still runs after gate in CI (secrets already stubbed in workflow).

---

### 4. Product domain / go-to-market surface broken

| URL | Result |
| --- | --- |
| `https://kompleet.ng` | **Does not resolve** |
| `https://kompleet.vercel.app` | 404 |
| `https://ivanotechnologies.com` | 200 (attached to old `kompleet` project) |
| `https://kompleet-techivano.vercel.app` | 200 |
| `https://kompleet-git-main-techivano.vercel.app` | 200 |

**Action:** Decide canonical domain (kompleet.ng vs ivanotechnologies.com), configure DNS + Vercel domain, SSL, redirects. Until then, “MVP launch” claims in Feb docs are invalid.

---

### 5. Supabase security advisors — fix before any user traffic

Project `frlcvkmjuhnjcicwywrh` (`KOMPLEET`) — **52 security lints** (51 WARN, 1 INFO):

| Finding | Count / note | Priority |
| --- | --- | --- |
| Tables visible to GraphQL (`anon` / `authenticated`) | 9 anon + 15 authenticated | **P0** — includes `expenses`, `expense_reports`, `ndpr_consents`, import tables |
| `SECURITY DEFINER` functions executable by `anon`/`authenticated` | 8 + 8 | **P0** — revoke public execute |
| Mutable function `search_path` | 9 | P1 |
| `review_queue` INSERT policy always true | 1 | **P0** |
| `review_actions` RLS on, **no policies** | 1 | **P0** (deny-all by accident or open?) |
| Leaked password protection disabled | 1 | P1 (Auth dashboard toggle) |
| Performance advisors | 132 (75 WARN) — mostly `auth_rls_initplan` (58), unused indexes (51) | P2 after ship |

Remediation links from Supabase linter should be followed; do **not** ship beta users until GraphQL grants + permissive RLS are closed.

---

## P1 — Soon (next 1–2 weeks)

### Residual CORS watch item
`src/lib/cors.ts` still allowlists `http://localhost:8081` and `exp://localhost:8081` **in production**. July-5 gate correctly blocked LAN wildcards in prod, but Metro localhost remains. Env-gate these behind `NODE_ENV !== "production"` or require `NEXT_PUBLIC_MOBILE_APP_URL` only.

### Duplicate / confused Vercel projects
- `kompleet` — domains on `ivanotechnologies.com`, last READY ~2026-03-25 (Dependabot preview SHAs), `live: false`
- `kompleet-platform` — linked to `KOMPLEET-PLATFORM`, July-5 ERROR deploy, only `*.vercel.app` aliases

Pick one; delete or archive the other after cutover.

### Dependabot backlog (10 open PRs)
All mergeable on paper but **build fails** on audit gate. After CI fix, group-merge safe minors (Radix, drizzle-orm patch, papaparse). Treat Expo major bumps (`expo-file-system` 19→57, `expo-sharing` 55→57) as a dedicated mobile session.

### Mobile binary stale
AAB from March 4. After web prod is green, rebuild Expo app against current API/CORS and ship a new internal build.

### Billing intentionally disabled
`src/app/api/expenses/billing/checkout/route.ts` — disabled pending legal review; no real charges. Fine for beta, but call it out in launch checklist.

### Auth schema legacy (`clerk_*`)
Migrations still have `clerk_users`, `get_clerk_user_id()`, etc. App direction is Supabase Auth — clarify whether Clerk paths are dead and schedule cleanup to avoid dual-identity bugs.

### Documentation drift
`docs/PROJECT_STATUS_SUMMARY.md` (Feb 6) claims 62% / blockers that contradict `MVP_LAUNCH_READINESS_REPORT.md` (also Feb 6, “READY”). **Neither is current.** Prefer this audit + live CI/Vercel/Supabase until status docs are rewritten.

---

## What’s already in good shape (do not re-litigate)

Completed 2026-07-05 (verified earlier by Claude + still on `main`):

1. Prod CORS gated (LAN wildcards off in production) — `f5b84d6b6`
2. Mock `/api/v1/records` + dashboard mock routes removed — `a6257b4ec`
3. Prisma removed; Drizzle standardized — `b2104004a`
4. Historical root markdown archived — `dd53b54ed`
5. Release tag **v1.2.6** published 2026-07-05
6. Strong automated coverage: RBAC, RLS policy tests, expense sprints, document intelligence, tax calculators, import/bank adapters

---

## Uncommitted local dirty state (ignore or discard unless intentional)

```
M .mcp.json          # Figma/GitHub MCP header tweaks — tooling only
M tests/__snapshots__/document-intelligence-extraction-regression.test.ts.snap
                     # appears LF/CRLF noise only (no substantive diff)
```

Do not mix into product PRs.

---

## Recommended attack order (for Claude → Cursor)

1. **Kezie decision:** Vercel Pro upgrade + canonical domain (`kompleet.ng` vs `ivanotechnologies.com`).
2. **Cursor:** Fix CI audit gate + xlsx exception strategy; get `main` CI `build` green.
3. **Cursor:** Fix Vercel env + prerender crash on calculator pages; successful production deploy.
4. **Cursor + Supabase MCP:** Close GraphQL anon grants, fix `review_queue` / `review_actions` RLS, revoke anon `SECURITY DEFINER` execute; enable leaked-password protection.
5. **Smoke:** Auth, transaction upload, expense OCR path, tax calculators, mobile CORS against prod URL.
6. **Hygiene:** Close/group Dependabot; rebuild mobile AAB; rewrite `PROJECT_STATUS_SUMMARY.md` to match reality.

---

## Cursor-ready prompt (copy/paste)

```text
Kompleet P0 deploy/CI recovery (do not expand scope):

1) Fix .github CI security gate: scripts/audit-ci.mjs fails on GitHub with
   "Failed to parse pnpm audit JSON" (npm classic audit endpoint retired / truncated).
   Replace with a reliable advisory check (prefer promoting OSV scanner or supported
   bulk audit API). Handle expired xlsx GHSA exceptions (expired 2026-06-01): either
   migrate off npm xlsx@0.18.5 to SheetJS CDN build, or renew explicit exception with
   new expiry + comment.

2) Fix Vercel production build for project kompleet-platform:
   Error: Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY while
   prerendering /calculators/business-tax. Ensure env on project OR make pages
   build-safe (no throw at module load during SSG). Redeploy and confirm READY.

3) Supabase project frlcvkmjuhnjcicwywrh security:
   - Revoke anon/authenticated GraphQL visibility on financial tables
   - Fix review_queue always-true INSERT policy
   - Add policies or disable RLS intentionally on review_actions
   - Revoke public EXECUTE on SECURITY DEFINER functions
   Do not change product features.

Verify: pnpm test, pnpm typecheck, CI build green, Vercel deployment READY.
```

---

## Sources used for this audit

- Live: `pnpm test`, `pnpm typecheck`, `pnpm audit:ci`
- GitHub: `gh run` / PR checks / commit statuses
- Vercel MCP: projects `kompleet`, `kompleet-platform`; deployment error logs
- Supabase MCP: `get_advisors` security + performance for `KOMPLEET`
- HTTP probes: kompleet.ng, vercel aliases, ivanotechnologies.com
- Repo HEAD `dd53b54ed` + memory.md July-5 verification notes

---

*End of audit. Prefer this file over Feb 2026 status/MVP markdown until those are rewritten.*
