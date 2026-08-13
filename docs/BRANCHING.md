# Branching & Promotion

**Adopted:** 2026-08-05. Supersedes the branch-per-feature model used through Phase 2.

## The model

Two long-lived branches. Nothing else persists.

```
work ──▶ staging ──▶ main ──▶ production (Vercel)
         (soak)      (promote)
```

| Branch | Role | Deploys to |
|---|---|---|
| `staging` | Integration. All work lands here first. | Vercel preview |
| `main` | Production. Only ever receives `staging`. | Vercel production |

**Note on terminology:** this is a promotion pipeline, not blue-green deployment. Blue-green means two live production environments with traffic switched between them. The safety property you want from blue-green — fast, safe revert — is provided by Vercel's instant rollback: promote any previous production deployment from the dashboard. No second environment required.

## Rules

1. **Work lands directly on `staging`.** No feature branches, no PRs for routine work. CI runs on push to `staging`; the Vercel preview is the review surface.
2. **`main` only ever receives `staging`**, by merge commit. Never commit to `main` directly.
3. **Never force-push `staging`.** It re-forks the branches. (The one-off reset on 2026-08-05 was a remedy for existing divergence, not a routine.)
4. **Promotion is deliberate.** Push to `staging`, let CI pass, check the preview, then promote. Don't promote on the same impulse as the push.
5. **Rollback is Vercel, not git.** Promote the previous production deployment. Fix forward on `staging` afterwards.

## The one exception — schema waves

Work that changes **RLS policies** gets a short-lived branch and a PR.

Reason: a bad RLS change landing on `staging` and then promoted is the cross-tenant leakage scenario in `docs/TENANCY_DESIGN.md` §3.2. Everything else is recoverable by rolling back a deployment; that one is not, because it is a data-exposure event rather than a broken build.

Branch, PR into `staging`, delete on merge. Schema itself still goes through a Supabase branch (`create_branch` → verify → `merge_branch`) per `docs/PHASE_3_BRIEF.md` §1.

## Dependabot

**Version updates: off. Security updates: on, auto-merged.**

- Routine bumps (minor/patch/major version updates) are disabled — that is the branch noise.
- **Security updates stay enabled.** This repository is public and handles financial data. Disabling CVE patching to tidy a branch list is a bad trade — this project has already hit an `xlsx` advisory and a broken audit gate in one cycle.
- Security PRs **auto-merge on green**, so their branches appear and delete themselves without manual handling.
- The OSV scan and `audit-ci` gate in CI remain the backstop.

Review dependency currency deliberately once a quarter rather than continuously.

## Repo settings that make this work

- **Automatically delete head branches** — on.
- **Branch protection on `main`**: require the CI checks (`secret-scan`, `typecheck`, `test`, `build`, `lint`, `check-schema-drift`, `check-tax-rates`), no direct pushes.
- **Branch protection on `staging`**: require the same checks, but allow direct pushes. The checks run; they just don't block the push.
- Allow auto-merge (needed for Dependabot security PRs).

## Why not trunk-only

`staging` earns its place: it caught the stranded Phase 2 in this project, and it is where a preview deployment gets looked at before production changes. With one developer and zero users the soak may be minutes — but it is a distinct step, and skipping it is how the last set of problems happened.
