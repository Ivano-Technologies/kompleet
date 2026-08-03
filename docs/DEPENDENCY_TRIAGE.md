# Dependency Triage — Dependabot Backlog (PRs #45–#54)

**Date:** 2026-08-03
**Repo:** `Ivano-Technologies/kompleet` (public)
**Context:** CI went green after several weeks red. Dependabot immediately opened 10 PRs.

This document gives a merge order, the reason for each decision, and the root cause of
the one PR that is actually broken (#47).

> **Note:** nothing here was merged, pushed or staged. This is a recommendation plus the
> rewritten `.github/dependabot.yml` that stops the backlog rebuilding.

---

## TL;DR — merge order

| Order | PR | Package | Action | Gate |
| --- | --- | --- | --- | --- |
| 1 | #46 | postcss | **Merge now** | CI only |
| 2 | #52 | autoprefixer | **Merge now** | CI only |
| 3 | #48 | @supabase/supabase-js 2.99→2.110 | **Merge now** | CI only |
| 4 | #50 | jspdf-autotable | **Merge after smoke test** | Invoice/expense PDF export |
| 5 | #54 | recharts | **Merge after smoke test** | Dashboard charts, light + dark |
| 6 | #51 | lucide-react 0.563→1.25 | **Merge after smoke test** | Visual pass, ~1 hour job |
| 7 | #47 | archiver 7→8 | **Needs a 2-line code fix first** | Bulk ZIP export |
| — | #45 | expo-file-system 19→57 | **Close / quarantine** | — |
| — | #53 | expo-updates 29→57 | **Close / quarantine** | — |

---

## 1. Merge immediately (CI is a sufficient gate)

These are patch/minor bumps with no API surface change touching this codebase. CI runs
`secret-scan`, `typecheck`, `build`, `test`, `lint` — that is enough signal.

### #46 postcss, #52 autoprefixer

Build-time only, no runtime surface. Note this repo is on Tailwind v4 with
`@tailwindcss/postcss`, so `autoprefixer` is close to vestigial here — these can be
merged blind. Merge both in one go.

### #48 @supabase/supabase-js 2.99 → 2.110

**Assessment: no breaking change for this app. Safe to merge.**

This is a minor bump inside v2 (2.99 → 2.110 is 99 → 110, forward). The reasons it is
low risk here are specific, not generic:

- **The SSR/cookie contract is not in this package.** Session handling lives in
  `@supabase/ssr@0.8.0`, which PR #48 does **not** touch. `middleware.ts`,
  `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` all get their cookie
  behaviour from `@supabase/ssr`, so the cookie/refresh path is untouched by this bump.
- **Peer range already satisfied.** `@supabase/ssr@0.8.0` declares
  `peerDependencies: { "@supabase/supabase-js": "^2.76.1" }`. 2.110.0 satisfies it, so
  there is no peer conflict and no risk of pnpm hoisting two copies.
- **The app already uses the post-deprecation APIs.** The three patterns that have
  historically broken on supabase-js upgrades are all already correct:
  - `middleware.ts:55` calls `await supabase.auth.getUser()`, **not** the deprecated
    `getSession()`. There is an explicit comment saying so.
  - `server.ts` and `middleware.ts` both use the `getAll` / `setAll` cookie interface,
    not the removed `get`/`set`/`remove` triplet.
  - `createBrowserClient` / `createServerClient` are imported from `@supabase/ssr`,
    not from `supabase-js`.

**One thing to watch, not a blocker:** `src/lib/supabase/server.ts:43` authenticates
mobile Bearer tokens via `client.auth.setSession({ access_token: token, refresh_token: "" })`.
Passing an empty `refresh_token` is a supported but slightly off-label pattern. It is
unchanged by 2.110, but if a future major tightens `setSession` validation this is the
line that breaks. The more durable form is to pass the token as a global header on
`createClient` instead. Worth a follow-up ticket; do not hold #48 for it.

**Caveat on the lockfile:** `apps/mobile/package.json` also depends on
`@supabase/supabase-js: ^2.45.0`. Since this is a pnpm workspace with a single lockfile,
merging #48 moves the mobile app to 2.110 as well. That is desirable (one copy, not two),
but it means the mobile app is transitively affected — worth a note in the PR.

---

## 2. Merge after a manual smoke test

CI has **no e2e or visual job**. `.github/workflows/ci.yml` runs typecheck/build/test/lint
only, and the sole Playwright spec (`e2e/auth-layout.spec.ts`) is not wired into CI.
So for anything that renders, green CI proves it compiles, not that it looks right.
`docs/source-of-truth.md` is a binding, "Non-Negotiable System Constraint" design spec,
which raises the cost of a silent visual regression.

### #50 jspdf-autotable — smoke test: PDF export

Used in `src/lib/pdf-generator.ts`, `src/lib/invoice-service.ts`, and
`src/app/api/expenses/export/route.ts`. `jspdf` itself is pinned hard by several
`pnpm.overrides` entries (`jspdf@<4.2.0` → `>=4.2.0`, `jspdf@<=4.2.0` → `>=4.2.1`), so
confirm the resolved `jspdf` still satisfies those overrides after install.

**Test:** generate one invoice PDF and one expense report PDF. Check table headers,
column alignment and page breaks.

### #54 recharts — smoke test: dashboard charts

Used in `src/components/charts/TaxProjectionChart.tsx`, `IncomeExpensesChart.tsx`,
`CategoryBreakdownChart.tsx`, and `src/app/(dashboard)/dashboard/DashboardClient.tsx`.
Recharts minors have a track record of shifting axis tick and legend spacing.

**Test:** load the dashboard in **both light and dark mode** and confirm the three charts
render with correct axes and legend, against the palette in `docs/source-of-truth.md`
(`--primary-500: #0a6847`, dark background `#050a08`).

### #51 lucide-react 0.563 → 1.25 — smoke test: visual icon pass

**Effort assessment: ~1 hour, not 1 week. Zero code changes expected.** See §4 for the
full analysis. Merge it after a visual pass, but do not treat it as a project.

---

## 3. #47 archiver 7 → 8 — ROOT CAUSE AND FIX

**Status: genuinely broken. Do not merge as-is. Needs a small code change.**

### What the Vercel build actually said

Deployment `dpl_9piK1uV1bANfykX1TmM31WSaNjXy` failed at the TypeScript step:

```
Attempted import error: 'archiver' does not contain a default export (imported as 'archiver').
Import trace for requested module:
./src/lib/export-service.ts
./src/app/api/export/bulk/route.ts

Failed to compile.
./src/lib/export-service.ts:13:8
Type error: Module '.../@types/archiver@8.0.0/node_modules/@types/archiver/index' has no default export.
> 13 | import archiver from "archiver";
     |        ^
Next.js build worker exited with code: 1
```

(The `lapack` and `bullmq` messages in the same log are pre-existing warnings from
`natural` and `bullmq`. They are noise — they do not fail the build.)

### Root cause

**archiver 8.0.0 is a pure-ESM rewrite that removed the callable default export.** The
only breaking change in the 8.0.0 release notes is `esm: node v18+ required` (#790),
which undersells it: converting to ESM changed the module's public shape.

archiver 7 shipped a callable factory (`archiver("zip", opts)`), typed as
`declare function archiver(...): archiver.Archiver; export = archiver;`.

archiver 8's `index.js` exports **only classes, and no default**:

```js
import Archiver from "./lib/core.js";
export { Archiver };
export class ZipArchive extends Archiver { ... }
export class TarArchive extends Archiver { ... }
export class JsonArchive extends Archiver { ... }
```

`@types/archiver@8.0.0` matches: it declares `export class Archiver`, `ZipArchive`,
`TarArchive`, `JsonArchive` and no default and **no callable factory function at all**.

So this is not a subtle interop or `esModuleInterop` problem — the factory function
that this codebase calls simply no longer exists. `tsconfig.json` already has
`esModuleInterop: true`; that is not the issue and changing it will not help.

### Blast radius

Small. archiver appears in exactly two places, both in one file:

- `src/lib/export-service.ts:13` — the import
- `src/lib/export-service.ts:681` — `const archive = archiver("zip", { zlib: { level: 9 } });`

Consumed by `src/app/api/export/bulk/route.ts` (bulk ZIP export).

### The fix

Two lines in `src/lib/export-service.ts`:

```ts
// line 13
- import archiver from "archiver";
+ import { ZipArchive } from "archiver";

// line 681
- const archive = archiver("zip", { zlib: { level: 9 } });
+ const archive = new ZipArchive({ zlib: { level: 9 } });
```

The rest of the usage in `createBulkExportZIP` is unchanged — `ZipArchive` extends
`Archiver extends stream.Transform`, so `.on("data" | "end" | "error")`, `.append()` and
`.finalize()` all keep the same signatures.

### After fixing, verify

1. `pnpm typecheck` and `pnpm build`.
2. **Exercise `POST /api/export/bulk` and open the resulting ZIP.** The compile error is
   the loud failure; the quiet risk is that archiver 8 being pure ESM changes how the
   Next.js server bundle loads it at runtime. A green build does not prove the ZIP
   streams correctly — the `on("end")` / `Buffer.concat` path in `createBulkExportZIP`
   must be run at least once.
3. Confirm `@types/archiver` moves to `^8.0.0` alongside the runtime package. They must
   move together; the type package's v8 shape only matches runtime v8.

**Recommendation:** rather than merging #47, close it and open a single PR that bumps
`archiver` + `@types/archiver` **and** contains the two-line `export-service.ts` change.
Dependabot cannot make that code change itself, so its PR will never go green on its own.

---

## 4. #51 lucide-react 0.563 → 1.25 — effort assessment

**Verdict: roughly a 1-hour job. Not a 1-week job. Expected code changes: none.**

### Usage in this codebase

- **73 import statements across 71 files** in `src/`
- **98 distinct icons** plus the `LucideIcon` type (99 imported names total)

That footprint is what makes this look like a week of work. It is not, because v1 did
not rename or remove any of the icons in use.

### What v1 actually changed

Two things create the misleading impression of a huge major:

1. **`1.0.0` was published by accident.** Its release notes are routine housekeeping —
   the real release is `1.0.1`, tagged "Lucide V1". The version jump from `0.577` to
   `1.0` was not a rewrite.
2. **The `0.x` → `1.x` jump does not signal an icon-naming break.** The big chart/circle
   icon renames (`BarChart3` → `ChartColumn`, `AlertCircle` → `CircleAlert`,
   `CheckCircle2` → `CircleCheck`, `MoreVertical` → `EllipsisVertical`, …) happened back
   in the `0.4xx` line, and **the old names were kept as permanent first-class aliases**,
   not deprecations. Verified against the installed 0.563 build:

   ```js
   export { default as BarChart3, ..., default as ChartColumn, ... } from './icons/chart-column.js';
   export { default as AlertCircle, ..., default as CircleAlert, ... } from './icons/circle-alert.js';
   ```

   These carry no `@deprecated` tag and were not removed in v1.

The actual v1 breaking changes, per the official v1 guide:

| v1 change | Impact here |
| --- | --- |
| **All brand icons removed** | **None.** Only 18 icons were deprecated in 0.563 — all brand marks (`Github`, `Slack`, `Twitter`, `Figma`, `Chromium`, …). **Zero overlap** with the 98 icons used. |
| **UMD build removed (ESM + CJS only)** | **None.** Next.js consumes ESM. Bonus: 11.4 MB → 1 MB gzipped. |
| **`aria-hidden="true"` set by default** | **Low, but this is the one to actually look at.** See below. |
| `lucide-vue-next` → `@lucide/vue` | N/A — React only. |
| New `LucideProvider` context | Additive, opt-in. |

### The one real risk: `aria-hidden` by default

v1 marks every icon `aria-hidden="true"`. That is correct for decorative icons and
improves the accessibility baseline for free. It regresses **icon-only controls** that
relied on the SVG for their accessible name.

Grep shows no test or component depends on icon roles (`getByRole('img')`, `.lucide`
selectors), so nothing will fail in CI. The check is a human one: audit icon-only
buttons — `TopBar.tsx`, `Sidebar.tsx` (2 import statements), `SettingsModal.tsx`,
`notification-badge.tsx`, `dialog.tsx` close buttons — and confirm each has an
`aria-label` on the **button**, not on the icon. Any that relied on the icon need a
label added. This is the only place changes are plausible.

### Design-spec implication

`docs/source-of-truth.md` binds colors (`#0A6847`), typography (Inter / Fira Code),
radii, shadows and the no-glassmorphism rule. **It does not define an icon registry or
name any icons**, so there is no spec clause to update and no cross-file consistency
contract to reconcile. The relevant risk is the general one: between 0.563 and 1.25,
individual glyphs may have been redrawn (v1.0.0 alone redrew `school` and `gpu` — neither
is used here). That is what the visual pass catches.

### Suggested plan (~1 hour)

1. Merge the bump, change no imports.
2. `pnpm typecheck` — should pass clean; any failure names the exact removed icon.
3. Visual pass over dashboard, invoices, reports, transactions in **light and dark**.
4. Audit the icon-only buttons listed above for `aria-label`.

---

## 5. Quarantine — #45 and #53 (Expo)

**Close both. Do not merge, do not rebase, do not leave them open.**

`apps/mobile` is on **Expo SDK 54** (`expo: ~54.0.33`). Its Expo package versions are
not arbitrary — they are pinned by the SDK:

- `expo-file-system: ~19.0.21` — correct for SDK 54
- `expo-updates: ~29.0.16` — correct for SDK 54

Dependabot is proposing `expo-file-system@57` and `expo-updates@57`, which are the
**SDK 57** releases. Expo SDK packages are version-locked to the SDK as a set. Installing
an SDK 57 module against an SDK 54 runtime produces a native build failure or a runtime
crash, and `expo-updates` specifically governs OTA delivery — a bad version there can
brick OTA for shipped clients. The `promote-ota.yml` and `eas-update.yml` workflows
depend on it.

These two PRs are also why the whole backlog feels stuck: they can never go green
individually, so they sit there looking like unfinished work.

**The correct way to do this upgrade**, when it is scheduled as its own piece of work:

```bash
cd apps/mobile
pnpm exec expo install expo@^57
pnpm exec expo install --fix     # moves every expo-* package to its SDK 57 pin together
pnpm exec expo-doctor
```

Then rebuild via EAS and test OTA on a staging channel before promoting. That is an
SDK migration, not a dependency bump.

The rewritten `.github/dependabot.yml` blocks Expo majors at `apps/mobile` and groups
in-SDK Expo updates, so this class of PR will not reappear.

---

## 6. Why the backlog piled up, and the config change

The old config had one `npm` entry at `/` with `open-pull-requests-limit: 10` and only a
`security-updates` group. Every routine version update therefore became its own PR, up
to the cap of 10 — which is exactly the wall that appeared. It also meant:

- Trivial patches (postcss, autoprefixer) cost the same review overhead as majors.
- The Expo majors, which can never merge, occupied 2 of the 10 slots indefinitely and
  starved real updates.
- `.github/workflows/` was **entirely unmanaged** — 6 workflows pinning third-party
  actions, with no update path.

The rewrite:

1. **Batches patch + minor into one weekly grouped PR per ecosystem.** Because no group
   declares `update-types: major`, majors fall outside every group and still open
   individually — which is the behaviour we want.
2. **Splits `/` (web) from `/apps/mobile` (Expo)** into separate entries, and defensively
   ignores `expo-*` / `react-native*` from the root entry. This matters because a pnpm
   workspace shares one lockfile, so the root entry can otherwise surface workspace-member
   dependencies and put an Expo major in the same PR as a web patch.
3. **Blocks Expo-SDK majors** in the mobile entry with a comment pointing at
   `expo install --fix`, and groups in-SDK Expo updates so they move as a set.
4. **Adds the `github-actions` ecosystem.**
5. **Preserves** the original `labels`, `allow: direct` and the `security-updates`
   catch-all group on both npm entries. Security updates are never batched into the
   routine group. (The original config had no `ignore` rules to preserve.)

Expected steady state: **one grouped PR per ecosystem per week**, plus an occasional
individual major — instead of ten.
