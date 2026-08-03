# Supabase API key migration checklist

**Goal:** Move from legacy JWT `anon` / `service_role` keys to publishable (`sb_publishable_…`) and secret (`sb_secret_…`) keys, then deactivate the leaked legacy pair — without rotating the JWT signing secret (that would invalidate every user session).

**Reference:** [Migrating to new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)

**Project:** `frlcvkmjuhnjcicwywrh`  
**Publishable key already provisioned:** `sb_publishable_WiVAzHAq4df8FtmaRGiloQ_-OcvqCze`  
**Variable names stay the same** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) — only the *values* change.

Legacy JWT keys are **deprecated end of 2026**. Both key types work simultaneously until you deactivate the legacy pair.

---

## Code prerequisites (landed in repo)

- [x] `src/lib/env.ts` accepts `eyJ…` **or** `sb_publishable_` / `sb_secret_` (migration window)
- [x] Document workers read `SUPABASE_SERVICE_ROLE_KEY` only (no `SUPABASE_SERVICE_KEY` alias)
- [x] `e2e/README.md` Admin API curl uses `apikey` only (no `Authorization: Bearer` for the project key)

---

## Owner dashboard steps

1. **Confirm new keys exist**  
   Dashboard → Project → [Settings → API Keys](https://supabase.com/dashboard/project/frlcvkmjuhnjcicwywrh/settings/api-keys) → **Publishable and secret API keys**.  
   - Publishable: already created (`default`).  
   - Create / copy a **secret** key (`sb_secret_…`) if you have not already. Prefer a named key per backend later; `default` is fine for the first swap.

2. **Do not deactivate legacy keys yet.**

3. **Swap values in every environment** (same env var names):

   | Where | Publishable → | Secret → |
   | --- | --- | --- |
   | Local `.env.local` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |
   | Vercel (Production + Preview) | same | same (mark secret) |
   | GitHub Actions secrets | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional `SUPABASE_SERVICE_ROLE_KEY` if CI ever needs real admin |
   | EAS / Expo secrets (`apps/mobile`) | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | n/a (mobile must never get the secret) |
   | Workers / Redis jobs (if deployed) | n/a | `SUPABASE_SERVICE_ROLE_KEY` (canonical name only) |

   Set GitHub / Vercel secrets yourself (UI or `gh secret set` at a **local prompt**). Do **not** paste secret keys into chat transcripts.

4. **Redeploy** web (Vercel). Smoke-test auth + a tax calculation.

5. **Mobile installs:** no store distribution; last artifact is a March internal AAB. If nobody has it installed, you may deactivate legacy keys and rebuild mobile whenever you next touch it. If someone still has the old build, update EAS secrets and ship a new binary before deactivation.

6. **Deactivate legacy** `anon` + `service_role` in the Dashboard (reversible). This is the step that closes the leak.

7. **Do not** rotate the JWT secret as part of this migration.

---

## Verification list

### Web / Vercel

- [ ] App boots with **legacy** keys after the env.ts change (dual-format refine) — no validation crash
- [ ] After swap: login / session still works (user JWTs are unchanged)
- [ ] A server route that uses `createAdminClient()` succeeds in staging/prod
- [ ] Browser network tab: Supabase REST calls carry `apikey: sb_publishable_…`, not a secret key
- [ ] No `Invalid JWT` errors from REST after the swap

### Mobile

- [ ] Confirm install population (likely none / owner-only)
- [ ] If installs exist: EAS secret updated + new binary before legacy deactivation
- [ ] If no installs: deactivate legacy; rebuild mobile later

### CI / scripts

- [ ] Typecheck / build CI green (`eyJ_ci_placeholder_*` still valid)
- [ ] `e2e/README.md` curl uses `apikey` only
- [ ] `scripts/check-security-advisors.mjs` uses `SUPABASE_ACCESS_TOKEN` → `api.supabase.com` — unaffected

### Postgres / Edge / webhooks

- [ ] No Edge Functions deployed (re-check if you add any)
- [ ] No `pg_net` / Database Webhooks holding a key
- [ ] If you add webhooks later: secret on `apikey` from Vault, never `Authorization: Bearer`

### After legacy deactivation

- [ ] Legacy keys rejected; app still functions
- [ ] Update `docs/SECRET_EXPOSURE_REMEDIATION.md`: service_role item closed via migration + deactivation
