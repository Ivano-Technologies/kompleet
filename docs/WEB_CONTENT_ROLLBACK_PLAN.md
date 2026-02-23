# Web Content Update — Rollback Plan

**Scope:** Revert changes from `docs/WEB_CONTENT_UPDATE_CHANGELOG.md`

## Rollback Trigger

- Critical user-reported issues (broken links, wrong contact info)
- SEO or performance regression
- Brand/legal requirement to revert

## Rollback Steps

### 1. Revert Git Commit

```bash
git revert <commit-hash> --no-edit
git push origin main
```

Or, if changes are on a feature branch:

```bash
git checkout main
git pull origin main
# Do not merge the content-update branch
```

### 2. Manual Revert (if Git revert not available)

| File | Revert to |
|------|-----------|
| `src/app/page.tsx` | Hero: "Control Your Money. Grow Your Business." with subheadline "Track every naira..."; Why KOMPLEET: "Built for Nigerian Businesses" heading only; remove aria-labels |
| `src/app/layout.tsx` | Remove openGraph, twitter from metadata; remove siteUrl |
| `src/app/(public)/press/page.tsx` | press@techivano.com |
| `src/app/(public)/contact/page.tsx` | hello@techivano.com, support@techivano.com |
| `src/app/(public)/careers/page.tsx` | careers@techivano.com |
| `src/app/(public)/privacy/page.tsx` | privacy@techivano.com, support@techivano.com |
| `src/app/(public)/cookies/page.tsx` | privacy@techivano.com |
| `src/app/(public)/terms/page.tsx` | support@techivano.com, legal@techivano.com, https://techivano.com |

### 3. Verify

- Run `pnpm build`
- Confirm no Techivano references if reverting to old brand
- Confirm email links work (if reverting to techivano.com)

### 4. Deploy

- Redeploy to staging/production per deployment process
- Verify homepage and contact flows

## Post-Rollback

- Document reason for rollback
- Update changelog with rollback entry
- Plan for re-application once fixes are ready
