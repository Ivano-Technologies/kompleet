# Observability Release Dashboard Template

## Purpose

Use this template to set up release monitoring in one pass across:
- Sentry (mobile runtime health + OTA rollout health)
- GitHub Projects (release pipeline governance)

Target outcome:
- Catch regressions early
- Gate rollout decisions with data
- Keep release status visible to engineering and stakeholders

## Prerequisites

- Sentry project has `environment` and `release` tags flowing from mobile app.
- Production traffic is labeled with `environment:production`.
- OTA releases are identifiable by release/update group (consistent release naming).
- GitHub Actions workflows are already active for build/update/release.

## Dashboard 1: Mobile Release Health (Sentry)

Create Sentry dashboard:
- Name: `Kompleet Mobile Release Health`
- Time range default: `Last 24 hours`
- Environment default filter: `environment:production`

Add the following widgets.

### 1) Crash-Free Sessions by Release

- Widget type: **Line chart** (or area chart)
- Dataset: **Sessions**
- Query:
  - `environment:production`
- Y-axis:
  - `percentage(sessions_crash_free)`
- Group by:
  - `release`

### 2) Crash-Free Users by Release

- Widget type: **Line chart**
- Dataset: **Sessions**
- Query:
  - `environment:production`
- Y-axis:
  - `percentage(users_crash_free)`
- Group by:
  - `release`

### 3) Release Adoption (Events/Transactions by Release)

- Widget type: **Top N / Table**
- Dataset: **Events** (or **Transactions** if preferred)
- Query:
  - `environment:production event.type:transaction`
- Y-axis:
  - `count()`
- Group by:
  - `release`

### 4) Error Volume Trend (24h)

- Widget type: **Line chart**
- Dataset: **Errors**
- Query:
  - `environment:production level:error`
- Y-axis:
  - `count()`
- Group by:
  - `time`

### 5) Top Crashing Issues (Current Release)

- Widget type: **Issue list / Top events table**
- Dataset: **Errors**
- Query:
  - `environment:production release:<LATEST_RELEASE>`
- Sort:
  - `count()` descending
- Limit:
  - `5`

### 6) New Issues Introduced in Latest Release

- Widget type: **Top N / Table**
- Dataset: **Errors**
- Query:
  - `environment:production release:<LATEST_RELEASE> is:unresolved`
- Y-axis:
  - `count()`
- Group by:
  - `issue`

## Dashboard 2: OTA Rollout Health (Sentry)

Create Sentry dashboard:
- Name: `Kompleet OTA Rollout Health`
- Time range default: `Last 24 hours`

Use a release identifier convention per OTA group, for example:
- `release:<APP_VERSION>-ota.<GROUP_ID>`
or another consistent OTA marker.

Add these widgets.

### 1) OTA Adoption by Group

- Widget type: **Top N / Table**
- Dataset: **Transactions**
- Query:
  - `environment:production event.type:transaction release:*ota*`
- Y-axis:
  - `count()`
- Group by:
  - `release`

### 2) Crash-Free Sessions per OTA Group

- Widget type: **Line chart**
- Dataset: **Sessions**
- Query:
  - `environment:production release:*ota*`
- Y-axis:
  - `percentage(sessions_crash_free)`
- Group by:
  - `release`

### 3) Error Rate per OTA Group

- Widget type: **Top N / Table**
- Dataset: **Errors**
- Query:
  - `environment:production release:*ota* level:error`
- Y-axis:
  - `count()`
- Group by:
  - `release`

### 4) OTA vs Binary Comparison

- Widget type: **Table**
- Dataset: **Errors**
- Query A (OTA):
  - `environment:production release:*ota*`
- Query B (Binary):
  - `environment:production !release:*ota*`
- Y-axis:
  - `count()`

Use this for promotion decisions (`10% -> 50% -> 100%`).

## Suggested Alert Rules (Sentry)

Create alerts to support rollout gates:

- **Crash-free session drop**
  - Condition: `sessions_crash_free < 99%` for latest production release
  - Action: notify Slack + on-call

- **Error spike after release**
  - Condition: `count()` above baseline (for example `> 2x` previous hour)
  - Filter: `environment:production release:<LATEST_RELEASE>`
  - Action: notify Slack + create incident ticket

- **New high-severity issue**
  - Condition: new issue with `level:fatal OR level:error` in production
  - Action: notify Slack immediately

## GitHub Project: Release Pipeline Board

Create project:
- Name: `Mobile Release Pipeline`
- Type: board

Columns:
1. `PRs Awaiting Review`
2. `Approved`
3. `Release Candidates`
4. `Tagged Releases`
5. `Post-Release Monitoring (24h)`
6. `Stable`

Recommended custom fields:
- `Release Version` (text)
- `Release Type` (single select: OTA/Binary)
- `Rollout Stage` (single select: 10%/50%/100%)
- `Crash-Free %` (number)
- `Owner` (person)
- `Go/No-Go` (single select)

Automation suggestions:
- Move to `Tagged Releases` when tag `v*.*.*` is pushed.
- Move to `Post-Release Monitoring (24h)` when production build succeeds.
- Move to `Stable` after 24h and crash-free threshold is met.

## Runbook: One-Pass Setup Checklist

1. Create both Sentry dashboards with widgets above.
2. Save dashboard filters for `environment:production`.
3. Create Sentry alert rules for crash-free and error spikes.
4. Create GitHub Project board and fields.
5. Define team ownership and escalation path in project description.
6. Add dashboard links to `docs/mobile-release.md`.

## Operational Notes

- Use one release naming convention across binary and OTA to keep queries accurate.
- Keep rollout decisions data-driven: do not promote OTA stage unless crash-free metrics stay within threshold.
- During freeze windows (`PRODUCTION_FREEZE=true`), continue monitoring production health dashboards even without new releases.
