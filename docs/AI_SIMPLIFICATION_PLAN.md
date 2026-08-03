# AI Stack Simplification — Claude, no ML, no AWS

**Decision:** 2026-08-03, owner. Remove the trained-ML tier and the AWS dependency entirely. Consolidate on Claude via the existing provider abstraction. Fix the rules tier so a genuine offline fallback exists.

---

## 1. What is actually there today

Three findings that shape this work:

**Two parallel AI stacks exist, and the wrong one is in use.**

| Stack | Location | Status |
|---|---|---|
| Provider abstraction | `src/lib/ai/providers/` — `claude-provider.ts`, `openai-provider.ts`, `kimi-provider.ts`, `fallback-provider.ts`, `factory.ts`, `types.ts` | Well-built. **Includes a Claude provider already.** Not used by categorization. |
| Direct OpenAI client | `src/lib/services/llm-categorization-service.ts` | Hardcodes `gpt-4o-mini`, instantiates `new OpenAI()` directly. **This is what the ensemble calls.** |

Most of this work is deletion and rewiring, not new code.

**The rules tier is dead.** `ensemble-categorization-service.ts` → `ruleCategorize()` builds its category list with `keywords: []` hardcoded (line ~78). `categorization-service.ts` matches on `category.keywords`. It has nothing to match against and returns `null` on every call.

So the advertised "LLM → Rule → ML" ensemble is really **LLM → nothing → ML**. Removing ML without fixing this leaves the system with no fallback at all.

**The ML model is fitted to synthetic data.** `ml-training/generate_dataset.py` generates the training corpus. With 0 real transactions in the database there is no real corpus and no drift to measure. The Flask service, S3 bucket, IAM key, model versioning and governance dashboard all support a model trained on invented examples.

---

## 2. Deletion surface

| Path | Note |
|---|---|
| `ml-service/inference.py` | Python Flask service. **Cannot run on Vercel** — needs separate hosting. Deleting this removes an entire deployment target. |
| `ml-training/` (`generate_dataset.py`, `train_fast.py`, `train_model.py`) | |
| `src/lib/ml/model-loader.ts` | S3 download + `.ml-models-cache/` |
| `src/lib/ml/monitoring.ts` | **Partly** — see §5, the inference-logging half is retained |
| `src/lib/services/llm-categorization-service.ts` | Replaced by the provider factory |
| `scripts/upload-models-to-s3.ts`, `scripts/upload-models-to-supabase.ts` | |
| `@aws-sdk/client-s3` in `package.json` | Verify no other consumer first |
| `openai` in `package.json` | Only if no other consumer — `openai-provider.ts` is being retained as a fallback option |
| S3 bucket `kompleet-ml-models` | Delete in AWS console |
| `ML_SERVICE_URL`, `AWS_*` env vars | Remove from `.env.example` and both templates |
| `public/ml-models/*.joblib`, `.ml-models-cache/` gitignore entries | |

**Keep `src/lib/ml/recurring-detection.ts`.** Despite its location it is statistical — interval and amount averaging — not a trained model. It powers the recurring-patterns UI and is unaffected. Consider moving it to `src/lib/services/` to stop it looking like ML.

**Security dividend:** this removes the only consumer of the AWS IAM key that leaked into the public repo. Deleting the bucket and the key makes the highest-financial-risk item from `docs/SECRET_EXPOSURE_REMEDIATION.md` moot rather than merely rotated.

---

## 3. Target architecture

```
                 ┌─ merchant cache hit ──────────────► return (0 cost, deterministic)
                 │
transaction ─────┼─ Claude (via provider factory) ───► AUTO_ACCEPT / SUGGEST
                 │        └─ on failure ─┐
                 │                       ▼
                 └─────────────────► rules tier ─────► SUGGEST
                                         └─ no match ─► MANUAL_REVIEW
```

Confidence thresholds and the `AUTO_ACCEPT` / `SUGGEST` / `MANUAL_REVIEW` routing in `ensemble-categorization-service.ts` are good design — **keep them unchanged**. Only the tiers beneath change.

### 3.1 Route through the existing factory

Replace the direct OpenAI client with `src/lib/ai/providers/factory.ts`, configured for Claude. Keep `openai-provider` and `kimi-provider` registered — the factory already supports fallback, so provider outage is handled by existing code rather than new code.

Model choice: use Haiku for bulk categorization and reserve a larger model for low-confidence escalation. Transaction categorization is a short classification task; it does not need a frontier model.

### 3.2 Fix the rules tier — required, not optional

This is the offline fallback and the cost control. Two changes:

1. Add a `keywords text[]` column to the `categories` table (23 rows, already seeded) and populate it for Nigerian merchants — banks, telcos (MTN, Airtel, Glo, 9mobile), retail (Shoprite, Jumia, Konga), fuel, transport (Bolt, Uber), utilities, POS operators.
2. In `ruleCategorize()`, pass the real keywords through instead of `[]`.

Seed the keyword list from Claude itself — a one-off generation task, reviewed by a human, committed as a migration. This is exactly the kind of thing to use an LLM for once rather than on every transaction.

### 3.3 Merchant cache — the key mitigation

Cache categorization results keyed on **normalized merchant name**, not raw description. Nigerian bank statements repeat merchants heavily, so this is expected to absorb the large majority of calls.

It solves three problems at once:

- **Cost** — repeat merchants are free after first sight
- **Determinism** — the same merchant always yields the same category, which matters because categorization feeds tax computation and an audit trail
- **Latency** — cache hits are instant

Implement as a table (`merchant_categorizations`: normalized_merchant, category_id, confidence, source, first_seen, hit_count) rather than in-memory, so it survives deploys and is inspectable. Scope it per-tenant if the practitioner model goes ahead — one firm's categorization of a merchant should not silently determine another's.

### 3.4 Batching and async

`api/ai/batch-categorize` already exists and `bullmq` is already a dependency. Bulk statement imports should enqueue rather than block, and batch multiple transactions per Claude call. A 500-row statement should not be 500 sequential API round-trips.

---

## 4. Costs and mitigations — stated honestly

| Concern | Reality | Mitigation |
|---|---|---|
| **Per-call cost** | Local inference was free after training; Claude bills per call. A practitioner at 200 clients × 500 txns/month ≈ 100k calls. | Merchant cache (largest lever), batching, Haiku for bulk |
| **Latency** | ~10ms local → ~500–2000ms API | Cache hits, batch calls, async queue via bullmq |
| **External dependency** | Anthropic outage stops categorization | Fixed rules tier + provider factory fallback to OpenAI/Kimi |
| **Non-determinism** | Same transaction may categorize differently across runs — a real property to lose in a compliance product | Merchant cache makes repeats deterministic; `inference_id` + reasoning already logged for audit |
| **NDPR / cross-border** | Nigerian taxpayer transaction data sent to a US API | `src/lib/ingestion/sanitizeForAI.ts` already strips account numbers, emails, phone numbers and names before any LLM call. **Same exposure as today with OpenAI** — this is a documentation and consent question, not a new risk. Document it in the privacy policy and NDPR consent copy. |

---

## 5. ML dashboard — repurpose for LLM observability

**Decision: keep the pages, repoint them.**

| Keep | Drop |
|---|---|
| `ml_inference_logs` (consider renaming `ai_inference_logs`) — provider, model, latency, confidence, cost | Model version / accuracy panels |
| `categorization_predictions` | Drift monitoring |
| `api/ml/corrections` + correction stats UI | Retraining triggers |
| `api/ml/recurring` + recurring patterns UI | |
| `/dashboard/ml-governance`, `/dashboard/ml-settings` (email section removed per `docs/DEFERRED_FEATURES.md`) | |

The human-correction loop stays valuable — corrections become **prompt examples and keyword-list improvements** rather than retraining data. Feed confirmed corrections back into the rules-tier keywords, which improves the free tier over time and reduces Claude calls. That is a better feedback loop than retraining ever was here.

Add cache hit-rate and cost-per-1000-transactions to the dashboard. Those are now the metrics that matter.

---

## 6. Verification

1. `pnpm typecheck` after each deletion — dangling imports surface immediately.
2. Unit tests: rules tier returns a real match for a seeded Nigerian merchant (this currently cannot pass — it is the proof the tier was dead).
3. Unit test: Claude provider failure falls through to rules, not to an exception.
4. Unit test: second categorization of the same normalized merchant hits cache and issues no API call.
5. `pnpm build` — confirms the Python service and AWS SDK are genuinely unreferenced.
6. Confirm `grep -ri "aws\|s3\|ML_SERVICE_URL" src/ scripts/` returns nothing outside comments.
