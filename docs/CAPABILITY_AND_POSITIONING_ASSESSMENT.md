# KOMPLEET — Capability Assessment & Positioning View

**Date:** 2026-08-02
**Method:** direct code inspection (79 API routes, 14 tables, `src/lib`, `src/modules`, schema) — not documentation
**Purpose:** input to a strategic direction decision

---

## 1. What is actually built

Verified in code. Nothing below is inferred from a roadmap.

### 1.1 Bank data ingestion — the strongest asset

`src/lib/transaction-import/`, `src/lib/ingestion/`

- **11 Nigerian bank statement adapters**: GTBank, Zenith, Access, First Bank, UBA, Ecobank, Stanbic IBTC, Fidelity, Union Bank, Moniepoint, Wema
- Format handling: CSV, Excel, PDF, ZIP; encoding detection (`chardet`/`iconv-lite`), encrypted-PDF detection, file-type sniffing
- Post-parse pipeline: normalization → deduplication → **balance validation** (reconciles running balance to catch parse errors) → duplicate detection
- **Mono open banking** integration (`lib/services/mono-service.ts`) — live account linking, exchange, sync

Balance validation is the detail that signals this was built by someone who has actually been burned by a bad parse. It is not a common feature.

### 1.2 Transaction categorization — three-tier ensemble

`src/lib/services/ensemble-categorization-service.ts`, `src/lib/ml/`

- Fallback chain **LLM → rules engine → ML model**, each with confidence scoring
- Outputs a routing decision: `AUTO_ACCEPT` / `SUGGEST` / `MANUAL_REVIEW` — i.e. designed for a human-in-the-loop workflow at volume, not one-off classification
- Continuous learning from user corrections (`ml/continuous-learning.ts`), recurring-transaction detection, drift monitoring, and an ML governance dashboard route
- Every inference carries an `inference_id` and reasoning string — auditable

### 1.3 Nigerian tax engine — current to the 2025 Act

`src/lib/services/tax-computation-service.ts`, `vat-service.ts`, `src/lib/tax/`

- **Nigeria Tax Act 2025, effective 1 January 2026** — encoded, not aspirational
- Entity classification: individual / small company / other company / very large company, with small-company qualification logic
- Computes: CIT, PIT, **development levy**, VAT at 7.5% (standard/exempt/zero-rated/out-of-scope treatments, recoverable input VAT), capital allowances, stamp duty, property tax
- Six calculators exposed in the dashboard
- Multi-year support with year switching and YoY comparison

### 1.4 Document intelligence — the best-engineered module

`src/modules/document-intelligence/`

Clean hexagonal architecture — `domain/`, `application/`, `ports/`, `infrastructure/` with swappable adapters.

- OCR via Tesseract (port-isolated, so a cloud OCR swap is a one-adapter change)
- Invoice field extraction: anchor detection, text normalization, field mapping, confidence calculation, structured-output hashing
- **Vendor template clustering** — learns per-vendor layouts across documents
- Cost-per-document estimator, Prometheus metrics, worker resource telemetry
- Review queue for low-confidence extractions (currently a stub implementation)

This module is production-grade in a way the rest of the codebase is not. It is separable and independently valuable.

### 1.5 Compliance output

- **NRS forms generated as filing-ready PDFs**: Company Income Tax Return, Personal Income Tax Return, VAT Return — with declaration blocks and signatory fields
- **E-invoicing** with NRS-compliant QR codes carrying a signature hash and verification URL; invoice archiving
- Deadline manager, filing status tracking (`mark-filed`), reminder history
- Financial statements: P&L, balance sheet, income statement, tax computation schedules
- NDPR consent tracking, immutable audit log, RBAC, RLS (all 52 Supabase lints closed in July), rate limiting

**Important limit:** forms are *generated*, not *submitted*. `app/(public)/help/page.tsx` states directly: "Direct e-filing integration is coming soon." The last mile to the revenue authority is manual.

### 1.6 Honest gaps

| Gap | Status |
| --- | --- |
| Direct e-filing to NRS | Not built — forms download for manual submission |
| Billing / payments | Deliberately disabled pending legal review (`expenses/billing/checkout`) |
| Profile editing | "Coming soon" |
| Review queue | Stub implementation |
| Mobile app | Expo app exists; AAB build dates to 2026-03-04 |
| E2E coverage | One spec for the entire platform |

---

## 2. The structural finding

**The data model is single-user. The capability depth is professional.**

Every domain table — `records`, `filings`, `invoices`, `customers`, `transactions`, `bank_accounts` — is keyed on `user_id`. One account equals one taxable entity. The only sharing primitive is `workspaces` / `workspace_members`, which exists solely inside the expenses module and offers just `viewer` / `editor` roles.

Now weigh that against what the product actually does: capital allowances, development levy, stamp duty, small-company qualification tests, VAT treatment classification, balance-validated statement reconciliation, confidence-routed bulk categorization.

**A Nigerian SME owner does not know what a capital allowance is.** They do not want a VAT treatment taxonomy. They want to know what they owe.

The person who needs all six calculators, who feels statement parsing as a daily cost, who tracks filing deadlines across many entities, and who will pay real money for it — is **the accountant or tax practitioner.**

So: the product has already been built for the practitioner. Only the schema still believes it is for the SME. That single mismatch is the strategic decision in front of you.

---

## 3. The four directions

### A — SME self-serve (current trajectory)

The Nigerian small business does its own books and files its own taxes.

- **For:** no refactor needed; largest addressable population; simplest story.
- **Against:** low willingness to pay, high informality, brutal CAC against low ACV. Critically, an SME that *does* have money for compliance usually spends it on an accountant rather than on software. You would be selling against the very buyer in option B.
- **Verdict:** the hardest path, and the one the product's own depth argues against.

### B — Accountant / tax-practitioner platform ⭐ recommended

The practitioner is the buyer, managing 20–200 client entities.

- **For:** fits everything already built. Statement parsing is a practitioner's single largest time sink, and 11 bank adapters plus balance validation attack it directly. Confidence-routed categorization is explicitly a review-at-volume workflow. Multi-year, YoY, deadline tracking, and form generation are practice-management primitives. ACV is 10–50× self-serve, and the buyer is concentrated and reachable through ICAN and CITN.
- **Against:** requires the tenancy refactor — a client/entity dimension across every table and every RLS policy, including the ones just hardened in July. This is the single largest piece of work in any option here. Practitioners are also conservative buyers who need references.
- **Verdict:** best fit between what exists and who will pay.

### C — Compliance infrastructure / API

Sell the tax engine, e-invoicing, and bank parsing as APIs to fintechs, accounting vendors, and banks.

- **For:** highest margin, no UI burden. The Tax Act 2025 plus the e-invoicing mandate create forced demand — every Nigerian software vendor touching money now needs this logic and most will not build it. The document-intelligence module is already port-isolated and separable.
- **Against:** enterprise sales cycle measured in quarters; requires an uptime and reliability record you do not yet have (no production URL, no SLOs, no alerting). Buyers will ask for a status page and a security review.
- **Verdict:** the strongest long-term business, but you are 12+ months of operational maturity away from being credible to that buyer.

### D — Narrow wedge: statement → categorized ledger

Ship only the ingestion plus categorization pipeline as a standalone tool.

- **For:** fastest to a paying user; the most genuinely differentiated component; hardest for a competitor to copy (11 adapters is grinding work, not cleverness).
- **Against:** leaves the tax engine — the actual moat — unmonetized. Risks being commoditized by Mono or a bank's own export improving.
- **Verdict:** not a destination, but an excellent **entry wedge into B**.

---

## 4. Recommendation

**Reposition to B, with D as the wedge.** Concretely: sell to Nigerian accountants and tax practitioners, and lead with "stop hand-keying client bank statements."

Three reasons.

**1. The product is already there.** The depth built is practitioner depth. This is a repositioning and one refactor — not a rebuild. Almost nothing gets thrown away.

**2. The timing is a wasting asset.** The Nigeria Tax Act 2025 took effect 1 January 2026. Every practitioner in the country is re-learning the rules *right now*, which means switching costs are temporarily near zero and a tool that already encodes the new Act is differentiated. That window is perhaps 12–18 months. By 2027 the incumbents will have caught up and practitioners will have settled into new habits. **Regulatory currency is the moat, and it depreciates.**

**3. It sequences into C.** Practitioner usage generates the volume, the reliability record, and the reference logos that an infrastructure buyer demands. B is not an alternative to C — it is the path to it.

### What B requires

| Work | Size | Note |
| --- | --- | --- |
| Client/entity dimension across schema + RLS | **Large** | The critical path. Touches every table and the July RLS work. Design it once, carefully. |
| Practitioner portfolio dashboard | Medium | Cross-client view: who is filed, who is overdue, what needs review |
| Client onboarding / invite / permissions | Medium | Extend beyond the expenses-only `viewer`/`editor` model |
| Cross-client deadline calendar | Small | `deadline-manager.ts` exists; needs the client dimension |
| Billing | Medium | Currently disabled — a practitioner product cannot be free |
| Direct e-filing | Large | Defer. Generated forms are acceptable at first; this becomes the retention hook later |

**Do the tenancy design before anything else, and do it deliberately.** It is the one decision that is expensive to reverse, and it lands on top of RLS policies you have just finished hardening. Everything else on that list is additive.

### What would change my mind

- If you have evidence of SME willingness to pay that I cannot see from the code, A becomes more defensible.
- If a specific fintech or bank is already asking for the tax engine as an API, take C directly — a named enterprise buyer beats a theoretical practitioner market.
- If the tenancy refactor is scoped and comes back as more than roughly six weeks, run D standalone first to generate revenue while B is built.

---

## 5. Domain migration — `kompleet.techivano.com`

Good call, and it resolves the earlier blocker cleanly. A subdomain of a domain you already control costs nothing, needs no Vercel plan change, and separates product identity from company identity — which matters more once there is a practitioner buyer who should never see "ivanotechnologies" in the URL bar.

Migration steps, in order:

1. Add the CNAME for `kompleet` in the `techivano.com` DNS zone, pointing at Vercel
2. Attach the domain to the `kompleet` Vercel project; wait for cert issuance
3. Set `NEXT_PUBLIC_SITE_URL=https://kompleet.techivano.com` per environment in Vercel — and **remove the hard-coded `https://kompleet.ng` from `.github/workflows/ci.yml`**, which is currently baked into every CI build
4. Update the Supabase Auth redirect allowlist and Site URL
5. Update the production origin allowlist in `src/lib/cors.ts`
6. Update OAuth consent screens (Google, Microsoft) and email template links
7. Promote to production alias and confirm `live: true` — the project currently reports `live: false`
8. Keep `ivanotechnologies.com` as a 301 for as long as you have testers on it

If the strategic shift to B lands, revisit naming before launch: `app.kompleet.ng` reads as a product, `kompleet.techivano.com` reads as an internal tool. Fine for now, worth changing before you charge a practitioner for it.
