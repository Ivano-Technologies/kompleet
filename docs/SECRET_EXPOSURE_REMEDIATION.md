# Credential Exposure — Remediation Runbook

**Opened:** 2026-08-02
**Severity:** Critical
**Scope:** `Ivano-Technologies/kompleet` (public), Supabase `frlcvkmjuhnjcicwywrh`, AWS `eu-west-1`
**Decision context:** repo remains public by choice; Vercel Pro declined. Public is a viable posture — but only with zero credentials in the tree and a blocking secret-scan gate. This runbook establishes both.

---

## 1. What is exposed

All of the following were committed and are readable by anyone.

| # | Credential | Location | In repo since | Blast radius |
| --- | --- | --- | --- | --- |
| 1 | **Supabase `service_role` JWT** | `deploy_rls.sh:4`, `scripts/upload-models-to-supabase.ts:7` | 2026-02-05 | **Total database compromise.** `service_role` bypasses every RLS policy. Full read/write on all customer financial records, expenses, invoices, `ndpr_consents`. Token `exp` = **2036-01-24** — it does not expire on its own. |
| 2 | **AWS IAM key + secret** | `scripts/upload-models-to-s3.ts:11-12` | 2026-02-06 | `AKIAUB7KGSIPWMQ6M3MN` + secret, `eu-west-1`. Scope depends on the IAM policy attached — assume at minimum full control of `kompleet-ml-models`, and check for wider grants. Billing abuse risk. |
| 3 | **GitHub token** (`ghu_…`) | `.user_env:2` | 2026-01-29 | Acts as the granting user against the org. |
| 4 | **Google Drive OAuth token** | `.user_env:5`, `.gdrive-rclone.ini:4` | 2026-01-29 | `scope = drive` — full Drive access for the granting account. |

**Also in history** (from a sandbox home directory committed then deleted): `.secrets/sandbox_api_token`, `.pki/nssdb/key4.db`, `.browser_data_dir/`.

### Exposure window

The credentials were committed in **late Jan / early Feb 2026**, while the repo was private. Vercel deployment metadata shows `githubRepoVisibility` flipping `private` → `public` between the March and July deploys — so they have been *world-readable* for roughly **three weeks or more**.

Treat automated compromise as likely, not hypothetical. Credential-scraping bots index new public commits within minutes, and `AKIA*` and Supabase JWTs are among the most heavily targeted patterns.

---

## 2. Immediate actions — do these first, in this order

Rotation is the only real cure. History rewriting is **not** a substitute: the repo is public, so GitHub's cache, any forks, and third-party mirrors already hold the old commits. **A credential that is not rotated is still live no matter what happens to git history.**

### Step 1 — Rotate the Supabase service_role key (do this first)

Supabase Dashboard → Project `frlcvkmjuhnjcicwywrh` → Settings → API → **Rotate `service_role` key** (this invalidates the JWT signing secret; the anon key rotates with it).

Then update, in this order:

- Vercel project `kompleet` → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (all environments)
- GitHub → repo Settings → Secrets → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`
- Any local `.env.local`
- Redeploy production, then confirm auth + a signed-in dashboard read still work

### Step 2 — Disable the AWS key

IAM → Users → find the principal for `AKIAUB7KGSIPWMQ6M3MN` → **Deactivate**, then delete after confirming nothing breaks.

- Review the attached policy to establish true blast radius before deleting the evidence.
- CloudTrail → filter on that access key ID, **from 2026-07-01 to now** → look for calls from unfamiliar IPs, regions you don't use, or `iam:*` / `ec2:RunInstances` activity.
- Check the AWS billing dashboard for anomalous spend (crypto-mining is the standard payload).
- Issue a replacement key scoped to `s3:PutObject`/`s3:GetObject` on `kompleet-ml-models` only.

### Step 3 — Revoke the GitHub and Google tokens

- GitHub → Settings → Applications / Personal access tokens → revoke the `ghu_…` grant.
- Google Account → Security → Third-party apps with account access → revoke the rclone/Drive grant.

### Step 4 — Assess database access

Supabase → Logs → filter the API/Postgres logs for `service_role` requests since 2026-07-01. You are looking for bulk reads, unfamiliar IPs, or access patterns that don't match your own deploy activity.

**If evidence of unauthorized access appears:** you hold Nigerian personal and financial data with `ndpr_consents` tables in scope, so NDPR breach-notification duties are engaged. Follow `docs/INCIDENT_RESPONSE.md` and get counsel involved before notifying. Do not skip this assessment because the platform has no public users yet — check first, then conclude.

---

## 3. Code changes already applied

Working tree scans clean for all four credential patterns.

| Change | File |
| --- | --- |
| Service-role key → `requireEnv("SUPABASE_SERVICE_ROLE_KEY")` | `scripts/upload-models-to-supabase.ts` |
| AWS key/secret → `requireEnv(...)`; region overridable | `scripts/upload-models-to-s3.ts` |
| Rewritten to take `SUPABASE_DB_URL` from env; `set -euo pipefail`; `ON_ERROR_STOP=1` | `deploy_rls.sh` |
| Removed from git index | `.user_env`, `.gdrive-rclone.ini`, `apps/mobile/google-services.json` |
| Hardened secrets section; `**/google-services.json` (was root-anchored `/google-services.json`, which never matched the real path), key material, cloud CLI config | `.gitignore` |
| New blocking `secret-scan` job on full history; `build` now `needs: secrets` | `.github/workflows/ci.yml` |
| New rules for Supabase JWTs, `ya29.` tokens, `gh*_` tokens, Postgres URIs with inline passwords | `.gitleaks.toml` |
| New `typecheck` job (previously defined in `package.json` but never run in CI) | `.github/workflows/ci.yml` |

**Not yet committed** — review first. Note the working tree also shows widespread CRLF/LF churn from the Windows mount; stage the security files explicitly rather than `git add -A`:

```bash
git add deploy_rls.sh .gitignore .gitleaks.toml \
        .github/workflows/ci.yml \
        scripts/upload-models-to-s3.ts scripts/upload-models-to-supabase.ts
git rm --cached .user_env .gdrive-rclone.ini apps/mobile/google-services.json
git commit -m "fix(security): remove committed credentials; add blocking secret-scan gate"
```

Then delete the local copies, which still hold live values:

```bash
rm -f .user_env .gdrive-rclone.ini
```

`apps/mobile/google-services.json` is now untracked but kept on disk — the mobile build needs it. Firebase config is low-sensitivity, but with the repo public it should not be tracked; supply it via EAS secrets instead.

---

## 4. History purge — DECLINED (2026-08-02, Kezie)

**Decision: no history rewrite.** History retains the credentials; rotation is relied on instead.

Rationale: the repo is public, so the affected commits are already in GitHub's cache, in any forks, and in third-party scrapes. Rewriting would reduce casual discoverability without undoing exposure, while costing every open Dependabot PR (#45–54) and every existing clone. Once Steps 1–3 are complete the committed values are inert.

**What this decision depends on.** It is sound *only if rotation is complete*. Any credential in §1 that is not rotated stays live and world-readable indefinitely — for the Supabase JWT that means until 2036. Section 6 is therefore not optional follow-up; it is the whole of the remediation.

Revisit if: a credential turns out not to be rotatable, or the exposure assessment in Step 4 finds evidence of actual unauthorized access.

<details>
<summary>Purge commands, retained for reference if the decision is revisited</summary>

```bash
pip install git-filter-repo
git filter-repo --invert-paths \
  --path .user_env \
  --path .gdrive-rclone.ini \
  --path .secrets \
  --path .pki \
  --path .browser_data_dir \
  --path .local \
  --path apps/mobile/google-services.json \
  --path-glob 'scripts/upload-models-to-*.ts' \
  --path deploy_rls.sh
git push --force --all && git push --force --tags
```

Sequence after clearing the dependency backlog, never before.
</details>

---

## 5. Standing rules now that the repo is public

1. **No credential ever enters the tree.** Everything through Vercel env vars, GitHub Actions secrets, or EAS secrets.
2. **`secret-scan` is a required status check.** Set it in Settings → Branches → `main` and `staging` protection rules — a CI job that can be merged past is decoration.
3. **Install the pre-commit hook** so leaks fail locally, not in CI:
   ```bash
   pnpm exec husky add .husky/pre-commit "gitleaks protect --staged --config .gitleaks.toml"
   ```
4. **Enable GitHub secret scanning + push protection** (free on public repos): Settings → Code security → Secret scanning → enable both. This blocks the push itself.
5. **Quarterly credential review** — every key in use, where it lives, when it was last rotated.
6. **Reconsider what else public exposes.** `SUPABASE_FULL_AUDIT.sql`, `THREAT_MODEL.md`, and the full RLS migration history are now a precise map of your authorization model. That is survivable if the policies are genuinely sound — the July audit closed all 52 lints, so they broadly are — but it raises the cost of any future RLS mistake. Consider moving threat-model docs to a private wiki.

---

## 6. Verification checklist

- [ ] Supabase `service_role` rotated; old JWT rejected; app still functions
- [ ] AWS key deactivated; CloudTrail reviewed since 2026-07-01; billing checked
- [ ] GitHub `ghu_` token revoked
- [ ] Google Drive grant revoked
- [ ] Supabase logs reviewed for unauthorized `service_role` use; NDPR assessment recorded
- [ ] Security commit pushed; `secret-scan` green on `main`
- [ ] `secret-scan` set as required status check on `main` and `staging`
- [ ] GitHub push protection enabled
- [ ] Local `.user_env` / `.gdrive-rclone.ini` deleted from disk
- [x] History purge decision made and recorded — **declined**, see §4

> Because history is not being rewritten, rotation is the *entire* remediation.
> An unticked box above is a live, world-readable credential.
