# Mobile App: Isolated npm Install

The mobile app is **excluded from the pnpm workspace** and uses **npm** for an isolated install. This avoids duplicate `react`/`react-dom` conflicts with the root Next.js app (which has drizzle-orm and other deps).

## Install

**From project root** (required for `pnpm mobile:install`):
```bash
pnpm mobile:install
```

**From `apps/mobile`** (use npm directly):
```bash
npm install
```
Note: `pnpm mobile:install` is a root-level script; run it from the repo root, not from `apps/mobile`.

## Verify

From **project root** (so duplicate-dependency check only sees apps/mobile):

```bash
pnpm mobile:doctor
```

From **apps/mobile**:

```bash
pnpm typecheck
npx expo prebuild
```

- **Duplicate react:** Run `pnpm mobile:doctor` from root; it temporarily hides root `node_modules` so expo-doctor only checks `apps/mobile`’s tree.
- **Expo API / network timeout:** If you see a ConnectTimeoutError, the Expo config schema check needs network access; retry or run behind a working connection.
- **Package versions vs SDK:** Run `npx expo install --check` in `apps/mobile` to align versions with the installed Expo SDK.
