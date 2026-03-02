# Kompleet Mobile Release Playbook

## Release Operations Hub

This document governs production mobile releases.

### Related Documents

- [Observability & Release Dashboard](./observability-release-dashboard.md)
- [Production Signoff Checklist](./ocr/PRODUCTION_SIGNOFF.md)
- [Freeze Mode & Governance Policy](./governance.md)

### Quick Links

- Trigger OTA: GitHub -> Actions -> `EAS Update`
- Promote Rollout: GitHub -> Actions -> `Promote OTA Rollout`
- Production Build: Tag `vX.Y.Z`
- Emergency Rollback: See section 5 below

## 1. Environments

| Environment | Purpose |
| --- | --- |
| development | Internal testing |
| preview | Stakeholder testing |
| production | App Store / Play Store |

## 2. OTA Update (No Store Review)

Used for:
- UI tweaks
- Logic fixes
- Minor improvements
- Feature flags

Trigger via GitHub:
- Go to Actions -> `EAS Update`
- Select environment
- Run workflow

This publishes to:
- `development`
- `preview`
- `production`

Production OTA requires environment approval.

## 3. Production Binary Release

Used for:
- Native dependency changes
- SDK upgrades
- App store submission

Steps:
```bash
git tag v1.2.0
git push origin v1.2.0
```

This triggers:
- `eas build --profile production --platform all`

Build numbers auto-increment. Artifacts appear in the EAS dashboard.

## 4. Supabase Environment Secrets

Run locally:
```bash
cd apps/mobile

eas secret:create --scope project \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value <env-specific-url>

eas secret:create --scope project \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value <env-specific-key>
```

Do not store these in git.

## 5. Rollback Procedure

OTA rollback:
```bash
cd apps/mobile
eas update:republish --group <previous-group-id>
```

Alternative: trigger OTA from a previous stable git commit.

Binary rollback:
- Promote a previous EAS build from the dashboard, or
- Re-tag a previous version:

```bash
git tag v1.1.3
git push origin v1.1.3
```

## 6. Emergency Stop

If production OTA causes crash:
- Immediately publish rollback OTA
- Disable release channel in EAS dashboard
- Notify stakeholders
- Investigate Sentry logs
