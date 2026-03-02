# Freeze Mode and Governance Policy

## Purpose

Define release guardrails for production mobile deployments.

## Freeze Mode

- Control switch: GitHub repository variable `PRODUCTION_FREEZE`.
- When `PRODUCTION_FREEZE=true`, production tag builds are blocked by workflow guard.
- Resume releases by setting `PRODUCTION_FREEZE=false`.

## Required Release Controls

- Protected `main` branch with required reviews and checks.
- Environment approval gate for production OTA.
- Preflight secret validation before OTA/build jobs.
- Tag-to-main verification for production release workflow.

## Operational Policy

- No production OTA rollout promotion without dashboard health review.
- Use phased rollout progression (`10% -> 50% -> 100%`) for production OTA.
- During freeze windows, monitor existing production health but do not ship.
