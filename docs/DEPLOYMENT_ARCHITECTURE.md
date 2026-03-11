# Deployment Architecture

This document describes the target deployment flow, environments, and release process.

## Target flow

```
Developer commit
      │
      ▼
GitHub
      │
      ▼
CI (tests + security)
      │
      ▼
Preview Deployment (Vercel)
      │
      ▼
Staging approval
      │
      ▼
Production deploy
```

## Environments

| Environment   | Branch          | Purpose                    |
|---------------|-----------------|----------------------------|
| **Preview**   | feature branches| Test individual changes    |
| **Staging**   | `staging`       | Pre-production / QA        |
| **Production**| `main`          | Live system                |

## Vercel configuration

In **Vercel project settings**:

- **Production Branch:** `main`
- **Branch deployments:**
  - `main` → Production
  - `staging` → Staging (e.g. `staging.kompleet.ng` or project-specific staging URL)
  - `feature/*` → Preview deployments

Pushing a branch like `feature/new-dashboard` creates a preview URL, e.g.:

`https://<project>-git-feature-new-dashboard-<team>.vercel.app`

## GitHub CI and protection

- CI runs on **pull requests** and **push** to `main` (see [docs/ci.md](./ci.md)).
- **Branch protection (recommended) for `main`:**
  - **Settings → Branches → Branch protection rules → Add rule**
  - Branch name: `main`
  - Require status checks to pass (CI)
  - Require at least 1 approval
  - Do not allow direct pushes (require PRs)

This prevents accidental production deploys and keeps history clean.

## Automated deployment flow

### Development

1. Create a feature branch: `git checkout -b feature/asset-dashboard`
2. Push: `git push origin feature/asset-dashboard`
3. **CI runs** and **Vercel creates a preview deployment**. Test on the preview URL.

### Staging

1. Merge feature into `staging`: e.g. open PR `feature/asset-dashboard` → `staging`
2. After merge, Vercel deploys the **staging** environment.
3. QA validates on staging (e.g. `staging.kompleet.ng`).

### Production

1. When staging is approved, merge `staging` → `main` (e.g. via PR).
2. Vercel automatically deploys **production**.
3. Production URL: e.g. `kompleet.ng` or your production domain.

## Git worktrees (optional, local)

For parallel work without branch switching:

```bash
# From repo root
git worktree add ../kompleet-feature-auth feature/auth
```

Example layout:

```
Projects/
├── kompleet-feature-auth   # feature/auth
├── kompleet-platform       # staging or default branch
└── kompleet-main-deploy    # main (production deploy worktree)
```

## Rollback

**Instant rollback** if production fails:

```bash
git revert <commit>
git push origin main
```

Vercel redeploys the reverted version (typically within ~15 seconds).

## Release tags (optional)

For versioned releases and rollback points:

```bash
git tag v1.2.0
git push origin v1.2.0
```

Tags give you permanent references for audits and rollback.

## End-to-end flow summary

```
Feature branch push
        │
        ▼
GitHub Actions (install, security gate, tests)
        │
        ▼
Vercel preview deployment
        │
        ▼
Merge → staging
        │
        ▼
Staging deployment
        │
        ▼
Merge → main
        │
        ▼
Production deployment
```

See also: [CI pipeline](./ci.md), [Deployment guide](./DEPLOYMENT_GUIDE.md).
