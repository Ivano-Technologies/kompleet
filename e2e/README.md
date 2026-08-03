# KOMPLEET end-to-end tests

Playwright suite covering the money paths: signup/login, bank statement import,
tax calculation, receipt OCR, and data export.

> **This repository is public.** No credential, key, token or password may be
> committed to any file in this directory. Everything sensitive is read from the
> environment at run time.

## Specs

| Spec | Money path | External calls stubbed? |
| --- | --- | --- |
| `auth-layout.spec.ts` | Shared auth page chrome | — |
| `auth-flow.spec.ts` | signup → verify prompt → login → protected-route redirects | Supabase `POST /auth/v1/signup` is intercepted so runs never create real accounts |
| `statement-upload.spec.ts` | CSV bank statement → parse → transactions in the ledger | No — hits `POST /api/transactions/upload-v2` and the real GTBank adapter |
| `tax-calculation.spec.ts` | PIT calculation → save → calculation history | No — hits `/api/tax-rules`, `/api/calculations/save`, `/api/calculations` |
| `expense-ocr.spec.ts` | receipt → OCR → prefilled expense → review queue | `POST /api/expenses/ocr` and `POST /api/ai/categorize` are intercepted (Tesseract output is slow and non-deterministic) |
| `export.spec.ts` | transactions/reports → CSV, XLSX, PDF downloads | No — asserts the real `Content-Disposition` and file magic bytes |

Fixtures live in `e2e/fixtures/`:

- `gtbank-statement.csv` — five rows in the exact shape GTBank (`GTB`) declares in
  `src/lib/transaction-import/bank-configs.ts`: `Date` (`DD/MM/YYYY`),
  `Transaction Details`, `Debit`, `Credit`, `Balance`. Running balances are
  internally consistent so the balance validator stays quiet. The spec stamps a
  per-run marker into each merchant before uploading, so repeated runs against
  the same account remain distinguishable.
- `receipt-sample.png` — a trivial placeholder image. Its pixels are irrelevant
  because OCR is intercepted; it only has to be a valid `image/*` upload.

## Environment variables

| Variable | Required for | Default | Notes |
| --- | --- | --- | --- |
| `E2E_BASE_URL` | Running against a deployment | _(unset)_ | When unset, Playwright starts `pnpm dev` on `http://localhost:3000` itself. When set, it assumes the target is already up and starts no server. |
| `PLAYWRIGHT_BASE_URL` | — | _(unset)_ | Alias for `E2E_BASE_URL`. |
| `E2E_USER_EMAIL` | All authenticated specs | _(unset)_ | Email of the seeded test user. |
| `E2E_USER_PASSWORD` | All authenticated specs | _(unset)_ | That user's password. |
| `NEXT_PUBLIC_SUPABASE_URL` | Local dev server only | from `.env.local` | Needed by `pnpm dev`; not needed when `E2E_BASE_URL` points at a deployment. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local dev server only | from `.env.local` | Same. |

If `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` are missing, every authenticated spec
**skips** rather than fails. The unauthenticated coverage (signup validation,
verification-callback redirects, protected-route redirects) still runs, so forks
and contributors without access to the test project get a useful signal.

Put local values in `.env.local` (already git-ignored) or export them in your
shell. Never add them to a file that is tracked by git.

## Seeding a test user

The account must be **email-confirmed** — `requireAuth()` in
`src/app/(dashboard)/layout.tsx` bounces unverified users to `/verify-email`, so
an unconfirmed user makes every authenticated spec fail on the login step.

Point this at a dedicated *test* Supabase project, never production. The suite
writes real rows (transactions, saved calculations, export history).

**Option A — Supabase dashboard (simplest)**

1. Authentication → Users → *Add user* → *Create new user*.
2. Enter the email/password you will export as `E2E_USER_EMAIL` /
   `E2E_USER_PASSWORD`.
3. Tick **Auto Confirm User**.

**Option B — Admin API**

Reads the service role key from your environment; do not paste it into a file.

```bash
curl -sS -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$E2E_USER_EMAIL\",\"password\":\"$E2E_USER_PASSWORD\",\"email_confirm\":true}"
```

New `sb_secret_…` keys are not JWTs — do not send them on `Authorization: Bearer`.
`apikey` alone is correct for both legacy and new secret keys when calling the Auth Admin API from curl.

### Other data the specs expect

- **Tax rules.** `tax-calculation.spec.ts` and the PDF test in `export.spec.ts`
  need the `individual_income_tax` rules readable through
  `GET /api/tax-rules?type=individual_income_tax`. Load `populate_tax_rules.sql`
  from the repository root into the test project. Without it the calculator
  renders a "Failed to load tax rules" banner and refuses to compute; the spec
  fails fast with that message rather than on a confusing selector.
- **Categories.** `expense-ocr.spec.ts` submits the receipt with no category on
  purpose (that is what puts it in the review queue), so an empty `categories`
  table is fine. Seeded categories only make the dropdown non-empty.

## Running locally

```bash
# 1. Install browsers once
pnpm exec playwright install chromium

# 2. Unauthenticated coverage only — no test account needed
pnpm test:e2e

# 3. Full suite against your own dev server
export E2E_USER_EMAIL='...'      # or put these in .env.local
export E2E_USER_PASSWORD='...'
pnpm test:e2e

# 4. Full suite against a deployed environment (no local dev server started)
E2E_BASE_URL=https://staging.example.com pnpm test:e2e

# Useful variations
pnpm test:e2e:ui                          # interactive UI mode
pnpm test:e2e e2e/export.spec.ts          # one spec
pnpm test:e2e --headed --project=chromium # watch it run
pnpm exec playwright show-report          # open the last HTML report
```

`pnpm test:e2e` with no `E2E_BASE_URL` reuses an already-running dev server on
`:3000` if there is one, otherwise it starts `pnpm dev` for you.

## CI

The `e2e` job in `.github/workflows/ci.yml` installs Chromium and runs
`pnpm test:e2e` on pushes and pull requests targeting `main` and `staging`.

Configure it in **Settings → Secrets and variables → Actions**:

- Variable `E2E_BASE_URL` — the deployment to test. Leave it unset to have CI
  boot `pnpm dev` instead.
- Secrets `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` — the seeded test account.
  Without them the authenticated specs skip.
- Secrets `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required
  whenever CI boots the local dev server (i.e. whenever `E2E_BASE_URL` is unset).
  `middleware.ts` constructs a Supabase client on **every** request, so without
  these the dev server 500s on every route and even the unauthenticated specs
  fail. Set `E2E_BASE_URL` or set both secrets — not neither.

The HTML report and traces are uploaded as the `playwright-report-<run id>`
artifact on every run, pass or fail.

## Conventions

- Selectors are grouped into a `*_SELECTORS` object at the top of each spec, as
  in `auth-layout.spec.ts`.
- Prefer role- and placeholder-based locators over CSS. Where a CSS selector is
  used it is anchored on something structural (`#file-input`,
  `select:has(option[value="GTB"])`) rather than on styling classes.
- Anything that could not be confirmed by reading the source is marked with a
  `TODO(verify):` comment in the spec rather than guessed at silently.
- Never write a credential into a spec, a fixture, or this file.
