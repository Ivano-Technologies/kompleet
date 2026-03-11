# CI Pipeline

This document describes the GitHub Actions CI pipeline and related security behaviour.

## Pipeline flow

1. **Install dependencies** — `pnpm install --frozen-lockfile` so installs are deterministic.
2. **Caches** — pnpm store (`~/.pnpm-store`) and Next.js build cache are restored to speed up runs.
3. **Automatic security fixes** — `scripts/security-fix.mjs` runs `pnpm audit --fix --prod` (production deps only) to patch fixable vulnerabilities before the gate.
4. **Lockfile check** — `git diff --exit-code pnpm-lock.yaml` fails the job if the lockfile was modified (e.g. by audit fix). This keeps CI aligned with the committed lockfile and avoids silent dependency drift.
5. **Security gate** — `scripts/audit-ci.mjs` runs the audit gate (see below).
6. **OSV scan** — `google/osv-scanner-action` runs a fast supply-chain vulnerability scan.
7. **Build** — `pnpm build` (and in parallel jobs: **lint**, **test**).

## Security gate and allowlist

- The gate fails only when a **high** or **critical** advisory has **no fix available** (`fixAvailable !== true`). Fixable issues are handled by the auto-fix step.
- **Time-limited exceptions** are configured in `scripts/audit-ci.mjs` via `ALLOWED_GHSA`: each entry has a `package` and an `expires` date (e.g. `2026-06-01`). If the current date is past `expires`, that exception is treated as **blocking** and the build fails. This avoids permanent security exceptions.
- To add or extend an exception: update `ALLOWED_GHSA` in `scripts/audit-ci.mjs` and set a short-term `expires` date; re-evaluate before it expires.

## Lockfile behaviour

- CI always installs with **`--frozen-lockfile`**, so the lockfile must match `package.json` or the install step fails.
- After the automatic security-fix step, **Check for modified lockfile** runs. If `pnpm audit --fix` (or any other step) changed `pnpm-lock.yaml`, the job fails. Fix by running `pnpm audit --fix --prod` locally, committing the updated lockfile, and pushing.
