---
name: Hybrid OCR Plan with Delivery Ops
overview: Expanded hybrid-modular OCR plan that adds CI/CD, Helm deployment manifests, and observability instrumentation while preserving extraction-safe boundaries for a future NestJS microservice.
todos:
  - id: foundation-module-and-ports
    content: Create document-intelligence clean module and define all boundary ports/entities/use-cases.
    status: pending
  - id: ocr-queue-worker
    content: Implement OCR/preprocessing adapters, queue abstraction, worker processor, and idempotent execution controls.
    status: pending
  - id: validation-engine-rules
    content: Implement deterministic validation rules and confidence scoring with audit logging.
    status: pending
  - id: integration-api-tax-search
    content: Integrate persistence/tax/search adapters and expose thin upload/status API wrappers.
    status: pending
  - id: supabase-migrations-rls
    content: Add Supabase migration files, indexes, and RLS policies for OCR data model.
    status: pending
  - id: cicd-helm-observability
    content: Add OCR CI workflow, Helm chart scaffolding, and observability metrics/alerts instrumentation.
    status: pending
  - id: testing-slo-validation
    content: Add tests and validate success criteria against latency, accuracy, and reliability targets.
    status: pending
isProject: false
---

# Hybrid OCR Plan with Delivery Ops

## Implementation Mode

- Build OCR/document intelligence in current Next.js repo under a modular clean-architecture boundary.
- Keep all core logic framework-agnostic for later extraction into `document-intelligence-service`.
- Add CI/CD, Helm, and observability in a way that works now and remains migration-ready.

## Required Architecture Rules

- No business logic in API routes; route handlers only parse/authorize/delegate/respond.
- No Next.js imports in domain/application layers.
- Repository pattern for persistence; no direct DB calls from controllers/use cases.
- Queue operations behind queue ports/adapters only.
- Idempotent job processing and deterministic output guarantees.

## Phase 1 - Module Foundation

- Create module at `src/modules/document-intelligence` with:
  - `domain/` entities + rule primitives
  - `application/` use cases
  - `infrastructure/` adapters
  - `interfaces/` controller + DTO mapping
  - module barrel export `src/modules/document-intelligence/index.ts`
- Define core contracts:
  - `DocumentRepositoryPort`
  - `OcrEnginePort`
  - `QueuePort`
  - `SearchIndexPort`
  - `TaxMappingPort`
  - `AuditLogPort`
- Add use cases:
  - process document
  - validate structured output
  - fetch processing status

## Phase 2 - OCR + Queue Infrastructure

- Implement OCR adapter (`TesseractAdapter`) and preprocessing service in infrastructure.
- Implement queue abstraction + worker processor with idempotency key enforcement.
- Add deterministic state machine for job lifecycle (`queued`, `processing`, `validated`, `completed`, `failed`).
- Keep worker bootstrapping separate from HTTP route lifecycle.

## Phase 3 - Validation Engine

- Implement deterministic rules:
  - VAT validation
  - subtotal/VAT/total reconciliation
  - duplicate detection
  - confidence scoring (rule-based only; no probabilistic financial inference)
- Persist validation outcomes and audit records with retention metadata.

## Phase 4 - Integration Layer

- Integrate validated output into tax services via adapter around `src/lib/services/tax-computation-service.ts`.
- Implement persistence repositories against Supabase.
- Add search indexing adapter (feature-flagged) for Elasticsearch/OpenSearch compatibility.
- Expose endpoints via thin wrappers:
  - `POST /api/v1/documents/upload`
  - `GET /api/v1/documents/:id/status`

## Phase 5 - Database Migrations (Supabase)

- Add new migration SQL files in `supabase/migrations`:
  - `documents`
  - `document_extractions`
  - `document_validation_logs`
  - `document_processing_jobs`
  - `invoice_audit_logs` extensions as needed
- Add RLS policies following existing `auth.uid()` ownership patterns.
- Add indexes for status polling, dedupe lookups, and search fields.
- Enforce uniqueness/idempotency constraints for job replay safety.

## Phase 6 - CI/CD Expansion

- Extend current workflow in `.github/workflows/ci.yml` with OCR module gates and optional container path.
- Add dedicated OCR pipeline workflow (`.github/workflows/ocr-service-ci.yml`) for:
  - lint/typecheck/test
  - docker build/tag
  - deploy step scaffold (non-destructive by default)
- Use secure auth for deployment steps (OIDC/secrets), not inline cluster assumptions.
- Add branch/path filters so OCR pipeline runs only on OCR-relevant changes.

## Phase 7 - Helm and Deployment Artifacts

- Add chart scaffold at `infra/helm/kompleet-ocr`:
  - `Chart.yaml`
  - `values.yaml`
  - `templates/deployment.yaml`
  - `templates/service.yaml`
  - `templates/hpa.yaml`
  - `templates/configmap.yaml`
- Correct Helm templating syntax and provide environment-specific values (`dev`, `staging`, `prod`).
- Wire autoscaling targets for worker-heavy OCR load profile.

## Phase 8 - Observability and SLO Hooks

- Add metrics/log/tracing instrumentation in OCR module:
  - OCR latency per page
  - queue wait/processing times
  - API p95
  - validation failure rates
  - extraction accuracy tracking
- Integrate with existing logging/error tooling and define forward-compatible hooks for Datadog/CloudWatch/ELK.
- Add dashboard spec + alert thresholds:
  - CPU > 80% for 5 min
  - queue backlog > 1,000
  - error rate > 2%

## Phase 9 - Verification and Readiness

- Add tests:
  - unit tests for domain rules
  - use-case tests for idempotency/retries
  - route integration tests for upload/status
- Validate target criteria:
  - field accuracy >= 95%
  - OCR latency <= 2s/page
  - upload-to-complete <= 10s
  - error rate < 1%
- Produce rollout notes and extraction-readiness checklist.

## Extraction-Ready Boundary Contract

- Service contract stabilized now:
  - `POST /documents` -> `{ documentId, status }`
  - `GET /documents/{id}` -> `{ status, confidenceScore, structuredData }`
- Structured JSON only leaves service boundary by default.
- Core layers remain transport/framework independent for later NestJS split.
