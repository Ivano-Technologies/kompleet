# Domain Migration — `ivanotechnologies.com` → `kompleet.techivano.com`

Cutover runbook for moving the KOMPLEET product onto its own canonical host.

- **Old host:** `ivanotechnologies.com` / `www.ivanotechnologies.com` (attached to the Vercel project today)
- **Dead host:** `kompleet.ng` (was hard-coded in CI, attached nowhere — it never served anything)
- **New canonical host:** `kompleet.techivano.com`
- **Vercel project:** `kompleet` · **team:** `techivano` · currently reports `live: false`
- **DNS zone to edit:** `techivano.com`

> This repository is public. Never paste an API key, token, service-role key or
> password into this file, into `.env.example`, or into any committed file.
> Everything below refers to secrets by environment-variable name only.

---

## Part 0 — What is already done in code

These changes are committed in the repo and need no manual action. They are
listed so you can tell the difference between "the code is wrong" and "a console
setting has not been flipped yet".

| File | Change |
| --- | --- |
| `.github/workflows/ci.yml` | `NEXT_PUBLIC_SITE_URL` no longer hard-codes `https://kompleet.ng`. It now reads the GitHub Actions variable `vars.NEXT_PUBLIC_SITE_URL`, falling back to `https://kompleet.techivano.com`. The canonical host is no longer baked into every build. |
| `src/lib/cors.ts` | Added `https://kompleet.techivano.com` to the always-allowed origins. Moved `http://localhost:8081` and `exp://localhost:8081` (Expo Metro) behind a `NODE_ENV !== "production"` check — they were previously allowlisted in production. |
| `src/lib/cors.test.ts` | Coverage for the new origin, for the retired hosts being rejected, and for the Metro localhost gating in both production and non-production. |
| `src/app/layout.tsx` | Open Graph `siteUrl` fallback changed from `https://www.ivanotechnologies.com` to `https://kompleet.techivano.com`. Still prefers `NEXT_PUBLIC_SITE_URL`. |
| `src/lib/email-service.ts` | All absolute links (`/filing`, `/notifications`, `/privacy`) now derive from a single `SITE_URL` constant backed by `NEXT_PUBLIC_SITE_URL`, instead of hard-coded `https://www.ivanotechnologies.com/...`. |
| `.env.example` | Comment for `NEXT_PUBLIC_SITE_URL` now documents the new canonical host. |

**Not changed, deliberately — see [Part 7](#part-7--open-decisions-for-the-owner).**
Mail addresses on `ivanotechnologies.com` (`support@`, `hi@`, `help@`,
`noreply@`) are a *mail* domain, not a *web* host. Migrating them is a separate
decision that requires DNS and Resend re-verification.

---

## Part 1 — Pre-flight (owner, ~10 min)

Do these before touching DNS. Nothing here is destructive.

1. **Confirm zone control.** You must be able to add records in the
   `techivano.com` DNS zone. Note which registrar/DNS provider holds it.
2. **Record the rollback target.** In the Vercel project `kompleet` (team
   `techivano`), note the deployment ID currently aliased to production, and
   the current values of every environment variable you are about to change.
   You cannot roll back to a value you did not write down.
3. **Lower the TTL** on the `techivano.com` zone to 300s (5 min) at least one
   existing-TTL period *before* cutover. If the zone TTL is 3600s, do this an
   hour ahead. This is what makes the rollback in Part 6 fast.
4. **Check `kompleet.techivano.com` is unused.** `dig kompleet.techivano.com`
   should return NXDOMAIN or nothing. If it resolves, find out what it serves
   before continuing.

---

## Part 2 — DNS and domain attachment (owner)

1. **Attach the domain in Vercel first, then create the record.** In the Vercel
   dashboard: project `kompleet` → Settings → Domains → Add
   `kompleet.techivano.com`. Vercel will show the exact record it wants.
2. **Create the CNAME** in the `techivano.com` zone:

   | Type | Name | Value | TTL |
   | --- | --- | --- | --- |
   | `CNAME` | `kompleet` | `cname.vercel-dns.com` | 300 |

   Use the target Vercel displays — do not copy the value above blindly, Vercel
   occasionally issues project-specific targets.
3. **Wait for verification.** Vercel's domain row goes to "Valid Configuration"
   and issues a Let's Encrypt certificate automatically. This is usually under
   five minutes once DNS propagates; it can take up to an hour.
4. **Do not remove `ivanotechnologies.com` yet.** Leave the old domains attached
   through the whole cutover — they are your rollback path.

---

## Part 3 — Environment variables (owner, per-environment)

Set these on the Vercel project `kompleet` → Settings → Environment Variables.
Set them *per environment*; do not use a single value for all three.

| Variable | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://kompleet.techivano.com` | leave unset (Vercel injects the per-deploy URL) or set to the preview branch alias | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | `https://kompleet.techivano.com` | preview alias | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `https://kompleet.techivano.com/api` | preview alias + `/api` | `http://localhost:3000/api` |
| `NEXT_PUBLIC_MOBILE_APP_URL` | the mobile app's production origin, if it has one | — | — |

`NEXT_PUBLIC_*` values are inlined at build time. **Changing them requires a
redeploy** — editing the variable alone changes nothing on the live site.

Also set the **GitHub Actions variable** so CI does not rely on the fallback:
GitHub → repo Settings → Secrets and variables → Actions → **Variables** tab →
New repository variable → `NEXT_PUBLIC_SITE_URL` = `https://kompleet.techivano.com`.
Use the *Variables* tab, not *Secrets* — this value is public by nature and
secrets are masked in logs, which makes build debugging harder.

Mobile app (`apps/mobile`): set `EXPO_PUBLIC_API_URL` to
`https://kompleet.techivano.com` in the EAS build profile. It currently defaults
to `http://localhost:3000`, which is correct for local development only.

---

## Part 4 — Third-party consoles (owner)

Each of these is an independent allowlist. Missing any one produces an auth
failure that looks like a code bug but is not.

### 4.1 Supabase

Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://kompleet.techivano.com`
- **Redirect URLs** — add, keeping the old entries until after verification:
  - `https://kompleet.techivano.com/auth/callback`
  - `https://kompleet.techivano.com/auth/callback?redirect=/reset-password`
  - `https://kompleet.techivano.com/**` (wildcard, if you prefer)
  - keep `http://localhost:3000/**` for local development

The app builds redirects from `window.location.origin` (see
`src/lib/supabase/auth.ts`, `src/app/signup/page.tsx`,
`src/app/forgot-password/page.tsx`), so it follows whatever host the browser is
on. That means the **only** thing standing between a working and a broken
signup is this allowlist.

Also check Authentication → Email Templates: the `{{ .SiteURL }}` token picks up
the Site URL above, but any template with a hand-written absolute link needs
editing.

### 4.2 Google OAuth

Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client:

- **Authorised JavaScript origins:** add `https://kompleet.techivano.com`
- **Authorised redirect URIs:** add the Supabase callback
  (`https://<project-ref>.supabase.co/auth/v1/callback`) if not already present,
  plus `https://kompleet.techivano.com/auth/callback`

OAuth consent screen → add `kompleet.techivano.com` and `techivano.com` to
**Authorised domains**. Note `docs/archive/GOOGLE_OAUTH_VERIFICATION_GUIDE.md`
already assumes `techivano.com` as the verified domain, which works in our
favour — the new host is a subdomain of an already-verified domain.

If the app is in "Published" state with sensitive scopes, changing the homepage,
privacy policy or terms URLs can trigger **re-verification**, which takes days.
Check whether the consent screen's homepage/privacy/terms URLs need to move to
the new host before you change them, and budget for the review.

### 4.3 Microsoft / Outlook OAuth

Azure Portal → App registrations → your app → Authentication:

- **Redirect URIs:** add `https://kompleet.techivano.com/api/email/callback/outlook`
  (this path is built from `NEXT_PUBLIC_APP_URL` in `src/lib/email/outlook.ts`)
- Branding & properties → update Home page URL, Terms of service URL, Privacy
  statement URL to the new host.

Google's Gmail equivalent is
`https://kompleet.techivano.com/api/email/callback/gmail`
(`src/lib/email/gmail.ts`). Add it to the same Google credential as 4.2.

### 4.4 Sentry, Resend, and anything else with an allowlist

- **Sentry:** project `kompleet-platform` (org `ivano-technologies`) — update
  allowed domains for the browser SDK if you have that restriction enabled.
- **Resend:** only needed if you also migrate the mail domain — see Part 7.

---

## Part 5 — Deploy and promote (owner)

1. **Merge the code changes** from Part 0 to `main`. Wait for CI green:
   `secret-scan` → `build`, plus `typecheck`, `test`, `lint`.
2. **Redeploy production** so the new `NEXT_PUBLIC_*` values are inlined. A
   fresh deploy from `main` is safer here than "Redeploy" on the old build —
   redeploying with the build cache can retain the old inlined values.
3. **Promote to the production alias.** The project reports `live: false`; a
   successful build is not a live site. In Vercel: Deployments → the new
   deployment → ⋯ → **Promote to Production**. Confirm the project reads
   `live: true` and that `kompleet.techivano.com` points at that deployment.
4. **Set up the old-host redirect** *(after* verification in Part 6 passes*)*.
   In Vercel Domains, set `ivanotechnologies.com` and
   `www.ivanotechnologies.com` to redirect to `kompleet.techivano.com` (308).
   Do not delete the old domains — a redirect preserves any existing inbound
   links and lets you undo by removing the redirect.

---

## Part 6 — Rollback

Trigger this the moment verification in Part 7 fails and you cannot fix it
within ~15 minutes. Rolling back is cheap; a broken auth flow is not.

Roll back in reverse order of blast radius:

1. **Fastest — repoint the alias.** Vercel → Deployments → the previous
   known-good deployment (the ID you recorded in Part 1.2) → **Promote to
   Production**. This reverts the served code and the inlined env values in one
   action, without touching DNS.
2. **Remove the old-host redirect** if you set it in Part 5.4, so
   `ivanotechnologies.com` serves the app directly again.
3. **Restore environment variables** to the values recorded in Part 1.2, then
   redeploy. Required only if the failure is env-related rather than code.
4. **DNS is the last resort.** The `CNAME` for `kompleet` can simply be left in
   place — an unattached subdomain is harmless. Only delete it if you are
   abandoning the migration entirely. Because you lowered TTL to 300s in
   Part 1.3, any DNS change takes effect in about five minutes.
5. **Leave the third-party allowlists alone.** The extra entries added in
   Part 4 are additive and cause no harm while rolled back. Removing them
   mid-incident only adds a second failure mode.

Raise the TTL back to its original value once the migration is confirmed stable
(give it a week).

---

## Part 7 — Post-cutover verification checklist

Run every item. Do not mark the migration done on a green build alone.

### Host and certificate

- [ ] `https://kompleet.techivano.com` returns HTTP 200 (not 404, not a Vercel
      "deployment not found" page).
- [ ] Certificate is valid, issued for `kompleet.techivano.com`, not expired,
      and not a wildcard mismatch. Check in a browser, or
      `openssl s_client -connect kompleet.techivano.com:443 -servername kompleet.techivano.com`.
- [ ] `http://kompleet.techivano.com` redirects to `https://`.
- [ ] HSTS header present (`Strict-Transport-Security`, set in
      `next.config.mjs`). Note `includeSubDomains` is enabled — confirm no other
      `*.techivano.com` subdomain is served over plain HTTP, or it will break.
- [ ] Vercel project reports `live: true`.

### Auth round-trip

- [ ] Email + password login succeeds and lands on `/dashboard` on the new host.
- [ ] Session survives a hard refresh (middleware session refresh is working).
- [ ] Google OAuth login completes end-to-end — no `redirect_uri_mismatch`.
- [ ] Microsoft/Outlook email connect completes — no `AADSTS50011`.
- [ ] Logout clears the session and redirects correctly.

### Signup and email links

- [ ] Create a **fresh** test account. The confirmation email arrives.
- [ ] The confirmation link points at `kompleet.techivano.com`, not at
      `ivanotechnologies.com`, `kompleet.ng`, or a `*.vercel.app` URL.
- [ ] Clicking it lands on `/auth/callback` on the new host and signs the user in.
- [ ] Password reset email link likewise points at the new host and works.
- [ ] A deadline reminder email (`src/lib/email-service.ts`) renders its
      "Go to Filing Center" / "Privacy Policy" links against the new host.
      This is the check that catches a missed `NEXT_PUBLIC_SITE_URL`.

### CORS from the mobile app

- [ ] Point the Expo app at `EXPO_PUBLIC_API_URL=https://kompleet.techivano.com`
      and confirm the dashboard, scan, and reports screens load data.
- [ ] A preflight from the mobile origin returns
      `Access-Control-Allow-Origin` echoing that origin and
      `Access-Control-Allow-Credentials: true`.
- [ ] **Negative check:** a request from `http://localhost:8081` against
      production is now *rejected* — no `Access-Control-Allow-Origin` header.
      This is the intended effect of the Part 0 change; if a developer reports
      "the app stopped working against prod", this is why, and the fix is to
      run Metro against a preview deployment or set
      `NEXT_PUBLIC_MOBILE_APP_URL`, not to re-open the hole.

### SEO and metadata

- [ ] View source on the landing page: `og:url` reads `https://kompleet.techivano.com`.
- [ ] `ivanotechnologies.com` returns a 308 to the new host (once Part 5.4 is done).
- [ ] Submit the new host in Google Search Console and add a change-of-address
      entry if the old host was indexed.

---

## Part 8 — Open decisions for the owner

These are genuinely ambiguous and were deliberately **not** decided in code.

1. **Mail domain.** `support@`, `hi@`, `help@` and `noreply@ivanotechnologies.com`
   remain hard-coded in `src/lib/email-service.ts`, `src/app/api/contact/route.ts`,
   and the public `/contact`, `/privacy`, `/terms`, `/careers`, `/cookies`,
   `/press` pages plus `src/components/landing/LandingFooter.tsx`. Moving them to
   `@techivano.com` requires new MX/SPF/DKIM records and re-verifying the sending
   domain in Resend. Decide whether the mail domain follows the web domain, or
   whether Ivano Technologies remains the corporate mail identity behind the
   KOMPLEET product. Until then, users see a `kompleet.techivano.com` site that
   emails from `ivanotechnologies.com` — survivable, but worth a decision.
2. **Marketing vs product split.** `docs/EXECUTION_PLAN_2026-08-02.md` §2.2
   recommended `app.kompleet.ng` for the product with marketing on `kompleet.ng`.
   This migration supersedes that with a single host. If you later want a
   marketing/product split, `kompleet.techivano.com` should become the product
   host and a separate marketing host added — plan for it now rather than
   migrating twice.
3. **Fate of `kompleet.ng`.** It is attached nowhere and referenced only in
   docs and test fixtures. Decide whether to register/renew it defensively as a
   brand asset or let it lapse.
4. **Instagram handle** `instagram.com/kompleet.ng`
   (`src/components/landing/LandingFooter.tsx`) is a social handle, not a
   domain, and was left alone. Confirm it is still the right account.
5. **Sentry org slug** `ivano-technologies` in `next.config.mjs` is an internal
   identifier, not a public URL. Renaming it breaks existing issue links; left
   as-is.
