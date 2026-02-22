# KOMPLEET ML Governance Architecture

**Document Version:** 1.0  
**Date:** February 6, 2026  
**Owner:** ML Governance Lead  
**Status:** Design Phase

---

## Executive Summary

This document outlines the comprehensive ML Governance architecture for KOMPLEET's machine learning systems, ensuring auditability, compliance, and risk management for all ML models in production. The framework addresses regulatory requirements (NDPR), internal risk policies, and industry best practices for responsible AI deployment.

---

## System Overview

### ML Components in Scope

The governance framework covers the following ML models currently deployed or planned for KOMPLEET:

**Transaction Categorization Model** - Automatically classifies financial transactions into tax-relevant categories (income, expenses, capital allowances, etc.) based on transaction descriptions, amounts, and merchant information.

**Recurring Transaction Detector** - Identifies recurring payment patterns to help users track subscriptions, regular expenses, and predictable income streams for better financial planning and tax estimation.

---

## Architecture Components

### 1. Model Registry

The Model Registry serves as the central source of truth for all ML models in the KOMPLEET ecosystem.

**Core Responsibilities:**

- Store immutable model artifacts (weights, configurations, preprocessing pipelines)
- Maintain comprehensive model metadata (training data, hyperparameters, evaluation metrics)
- Track model lineage (parent models, training code versions, dataset versions)
- Enforce semantic versioning for all model releases
- Provide API access for model deployment and retrieval

**Data Schema:**

```typescript
interface ModelRegistryEntry {
  modelId: string; // UUID
  modelName: string; // e.g., "transaction-categorizer"
  version: string; // Semantic version: MAJOR.MINOR.PATCH
  status: "draft" | "approved" | "deployed" | "deprecated" | "archived";
  artifactUrl: string; // S3/storage location
  trainingDataset: {
    datasetId: string;
    version: string;
    recordCount: number;
    dateRange: { start: Date; end: Date };
    consentStatus: "compliant" | "review_required";
  };
  trainingMetadata: {
    framework: string; // e.g., "scikit-learn", "tensorflow"
    codeVersion: string; // Git commit SHA
    hyperparameters: Record<string, any>;
    trainingDuration: number; // seconds
    computeResources: string;
  };
  evaluationMetrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    auc?: number;
    customMetrics: Record<string, number>;
  };
  fairnessMetrics: {
    biasChecked: boolean;
    categoriesAnalyzed: string[];
    disparateImpact?: number;
    notes: string;
  };
  changelog: string; // Markdown description of changes
  createdBy: string; // User ID
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  deployedAt?: Date;
  deprecatedAt?: Date;
}
```

### 2. Audit Trail System

Comprehensive logging of all ML lifecycle events for compliance and troubleshooting.

**Event Types:**

- Model training initiated/completed
- Model registered/updated
- Model deployment requested/completed
- Model inference executed
- Model rollback triggered
- Drift detection alert fired
- Approval granted/denied
- Model deprecated/archived

**Audit Log Schema:**

```typescript
interface AuditLogEntry {
  logId: string; // UUID
  timestamp: Date;
  eventType: string; // e.g., "model_deployed"
  modelId: string;
  modelVersion: string;
  userId: string; // Actor
  action: string; // Human-readable description
  metadata: Record<string, any>; // Event-specific data
  ipAddress?: string;
  userAgent?: string;
  result: "success" | "failure";
  errorMessage?: string;
}
```

**Retention Policy:**

- Audit logs retained for minimum 7 years (NDPR compliance)
- Immutable storage (append-only, no deletions)
- Encrypted at rest and in transit
- Regular backups to separate storage

### 3. Approval Workflow Engine

Enforces governance gates before model deployment to production.

**Workflow Stages:**

**Stage 1: Pre-Deployment Review**

- Model performance meets minimum thresholds
- Evaluation metrics documented
- Training data lineage verified
- Code review completed
- Unit tests passing

**Stage 2: Compliance Sign-Off**

- NDPR compliance verified (data consent, processing lawfulness)
- Data sources documented
- Privacy impact assessment completed (if required)
- Sensitive data handling reviewed

**Stage 3: Security Review**

- Model artifact integrity verified (checksums)
- Access controls configured
- Inference API security reviewed
- Rate limiting configured

**Stage 4: Final Approval**

- ML Governance Lead approval
- Compliance Officer sign-off
- Deployment scheduled

**Approval Schema:**

```typescript
interface ApprovalWorkflow {
  workflowId: string;
  modelId: string;
  modelVersion: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  stages: Array<{
    stageName: string;
    status: "pending" | "approved" | "rejected";
    reviewer: string;
    reviewedAt?: Date;
    comments?: string;
    checklist: Array<{
      item: string;
      checked: boolean;
      evidence?: string;
    }>;
  }>;
  createdAt: Date;
  completedAt?: Date;
}
```

### 4. Model Versioning System

Semantic versioning strategy for all models:

**Version Format:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes (API changes, output format changes, category changes)
- **MINOR:** New features (new categories, improved accuracy, new input fields)
- **PATCH:** Bug fixes, minor improvements (no functional changes)

**Version Control:**

- All model artifacts stored with version tag
- Immutable artifacts (no overwriting)
- Version history maintained indefinitely
- Rollback capability to any previous version

### 5. Drift Detection & Monitoring

Continuous monitoring of model performance in production.

**Monitoring Metrics:**

- **Data Drift:** Input distribution changes (feature statistics)
- **Concept Drift:** Model performance degradation (accuracy, precision, recall)
- **Prediction Drift:** Output distribution changes (category distribution shifts)

**Alert Thresholds:**

- Accuracy drop > 5% from baseline → Warning
- Accuracy drop > 10% from baseline → Critical alert
- Data drift score > 0.3 → Investigation required
- Prediction distribution shift > 15% → Review required

**Drift Detection Schema:**

```typescript
interface DriftMonitoring {
  monitoringId: string;
  modelId: string;
  modelVersion: string;
  timestamp: Date;
  metrics: {
    dataDriftScore: number;
    conceptDriftScore: number;
    predictionDriftScore: number;
    performanceMetrics: Record<string, number>;
  };
  alertLevel: "normal" | "warning" | "critical";
  actionTaken?: string;
}
```

### 6. Rollback Mechanism

Fast, safe rollback to previous model versions in case of issues.

**Rollback Triggers:**

- Critical drift alert
- Production incident
- Compliance violation discovered
- Manual governance decision

**Rollback Process:**

1. Identify target version (previous stable version)
2. Verify target version availability
3. Create rollback approval (expedited workflow)
4. Switch inference endpoint to target version
5. Log rollback event
6. Monitor new version performance
7. Post-incident review

**Rollback SLA:** < 15 minutes from decision to completion

### 7. Inference Logging

Track all model predictions for auditability and debugging.

**Inference Log Schema:**

```typescript
interface InferenceLog {
  inferenceId: string;
  timestamp: Date;
  modelId: string;
  modelVersion: string;
  userId?: string; // If user-initiated
  transactionId?: string; // If transaction-related
  inputFeatures: Record<string, any>; // Anonymized if sensitive
  prediction: any;
  confidence?: number;
  latency: number; // milliseconds
  errorOccurred: boolean;
  errorMessage?: string;
}
```

**Retention:** 90 days (rolling window), aggregated statistics retained indefinitely

---

## Technology Stack

### Storage Layer

- **Model Artifacts:** S3-compatible object storage (versioned buckets)
- **Metadata:** PostgreSQL (model registry, approvals, workflows)
- **Audit Logs:** PostgreSQL (separate database, append-only)
- **Inference Logs:** TimescaleDB (time-series optimized)

### Application Layer

- **Model Registry API:** Node.js/Express (TypeScript)
- **Approval Workflow Engine:** Node.js with state machine library
- **Drift Detection:** Python (scikit-learn, scipy)
- **Monitoring:** Prometheus + Grafana

### Security

- **Authentication:** JWT tokens (existing KOMPLEET auth)
- **Authorization:** Role-based access control (RBAC)
- **Encryption:** TLS 1.3 in transit, AES-256 at rest
- **Audit:** All API calls logged

---

## Data Flow Diagrams

### Model Deployment Flow

```
[Data Scientist]
    ↓ (1) Train Model
[Training Pipeline]
    ↓ (2) Register Model
[Model Registry]
    ↓ (3) Create Approval Workflow
[Approval Workflow Engine]
    ↓ (4) Review Stages
[Compliance Officer] → [Security Reviewer] → [ML Governance Lead]
    ↓ (5) Approval Granted
[Deployment Service]
    ↓ (6) Deploy to Production
[Inference API]
    ↓ (7) Log Deployment
[Audit Trail]
```

### Inference Flow with Monitoring

```
[User Transaction]
    ↓ (1) Inference Request
[Inference API]
    ↓ (2) Load Model from Registry
[Model Registry]
    ↓ (3) Execute Prediction
[ML Model v1.2.3]
    ↓ (4) Return Prediction
[Inference API]
    ↓ (5) Log Inference
[Inference Logs]
    ↓ (6) Aggregate Metrics
[Drift Detection Service]
    ↓ (7) Check Thresholds
[Alert System] (if drift detected)
```

### Rollback Flow

```
[Drift Alert / Incident]
    ↓ (1) Trigger Rollback
[ML Governance Lead]
    ↓ (2) Identify Target Version
[Model Registry]
    ↓ (3) Create Expedited Approval
[Approval Workflow Engine]
    ↓ (4) Fast-Track Approval
[Compliance Officer]
    ↓ (5) Execute Rollback
[Deployment Service]
    ↓ (6) Switch to Previous Version
[Inference API]
    ↓ (7) Log Rollback Event
[Audit Trail]
    ↓ (8) Monitor Performance
[Drift Detection Service]
```

---

## API Endpoints

### Model Registry API

```
POST   /api/ml-governance/models                    # Register new model
GET    /api/ml-governance/models                    # List all models
GET    /api/ml-governance/models/:id                # Get model details
GET    /api/ml-governance/models/:id/versions       # List model versions
PUT    /api/ml-governance/models/:id/status         # Update model status
POST   /api/ml-governance/models/:id/deprecate      # Deprecate model

POST   /api/ml-governance/approvals                 # Create approval workflow
GET    /api/ml-governance/approvals/:id             # Get workflow status
PUT    /api/ml-governance/approvals/:id/stages/:stage # Approve/reject stage

GET    /api/ml-governance/audit-logs                # Query audit logs
GET    /api/ml-governance/audit-logs/:modelId       # Model-specific logs

POST   /api/ml-governance/rollback                  # Initiate rollback
GET    /api/ml-governance/drift/:modelId            # Get drift metrics

POST   /api/ml-inference/predict                    # Execute inference
GET    /api/ml-inference/models/active              # Get active model versions
```

---

## Security & Access Control

### Role-Based Permissions

| Role                   | Permissions                                                    |
| ---------------------- | -------------------------------------------------------------- |
| **Data Scientist**     | Register models, view metrics, create approval requests        |
| **ML Governance Lead** | All model operations, approve deployments, initiate rollbacks  |
| **Compliance Officer** | View all models, approve/reject compliance stage, audit access |
| **Security Reviewer**  | View models, approve/reject security stage                     |
| **Platform Engineer**  | Deploy approved models, configure infrastructure               |
| **Auditor**            | Read-only access to all logs and models                        |

### Sensitive Data Handling

- **Training Data:** Anonymized before storage, consent tracking mandatory
- **Inference Inputs:** PII masked in logs, full data only in secure processing
- **Model Artifacts:** Access-controlled, encrypted, integrity-verified
- **Audit Logs:** Tamper-proof, encrypted, long-term retention

---

## Compliance Readiness

### NDPR (Nigeria Data Protection Regulation)

**Data Processing Lawfulness:**

- Documented legal basis for each model's data processing
- Consent tracking for training data
- Data minimization principles applied
- Purpose limitation enforced

**Data Subject Rights:**

- Right to explanation: Model decision logging
- Right to object: Manual override capability
- Right to erasure: Data deletion procedures

**Privacy Impact Assessments:**

- Required for models processing sensitive categories
- Documented in approval workflow
- Reviewed annually

### Audit Evidence Packs

Pre-prepared documentation for regulatory audits:

- Model inventory with versions and deployment dates
- Training data lineage and consent records
- Approval workflow history
- Incident reports and resolutions
- Drift detection reports
- Fairness and bias assessments

---

## Governance KPIs

### Operational Metrics

| KPI                                   | Target          | Measurement                               |
| ------------------------------------- | --------------- | ----------------------------------------- |
| Time to rollback faulty model         | < 15 minutes    | Median rollback duration                  |
| Models with complete documentation    | 100%            | % of models with all required metadata    |
| Audit readiness score                 | > 95%           | % of compliance requirements met          |
| Incidents caused by model regressions | < 2 per quarter | Count of production incidents             |
| Approval workflow completion time     | < 48 hours      | Median time from submission to deployment |
| Drift detection coverage              | 100%            | % of production models monitored          |

### Compliance Metrics

| KPI                                  | Target | Measurement                                 |
| ------------------------------------ | ------ | ------------------------------------------- |
| NDPR compliance rate                 | 100%   | % of models with documented legal basis     |
| Consent tracking completeness        | 100%   | % of training datasets with consent records |
| Audit log retention compliance       | 100%   | % of logs meeting 7-year retention          |
| Privacy impact assessments completed | 100%   | % of required PIAs completed                |

---

## Incident Response

### Model Regression Incident

**Detection:**

- Drift monitoring alert
- User complaints
- Manual testing

**Response:**

1. Assess severity (minor, major, critical)
2. Initiate rollback if critical
3. Investigate root cause
4. Document findings
5. Implement fix
6. Re-deploy with approval
7. Post-incident review

**SLAs:**

- Critical: Rollback within 15 minutes
- Major: Resolution within 4 hours
- Minor: Resolution within 24 hours

### Data Breach / Privacy Incident

**Response:**

1. Contain breach (disable affected models)
2. Notify Compliance Officer immediately
3. Assess scope (affected users, data types)
4. Notify NDPC if required (within 72 hours)
5. Remediate vulnerability
6. Notify affected users if required
7. Document incident and lessons learned

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- Set up model registry database
- Implement basic model registration API
- Create audit logging infrastructure
- Define approval workflow schema

### Phase 2: Core Features (Weeks 3-4)

- Build approval workflow engine
- Implement versioning system
- Create rollback mechanism
- Set up drift detection (basic)

### Phase 3: Monitoring & Dashboards (Weeks 5-6)

- Build governance dashboard UI
- Implement drift monitoring service
- Create audit log viewer
- Set up alerting system

### Phase 4: Documentation & Training (Week 7)

- Write governance policies
- Create runbooks and checklists
- Prepare audit evidence packs
- Train team on new processes

### Phase 5: Production Rollout (Week 8)

- Migrate existing models to registry
- Enable approval workflows
- Go-live with monitoring
- Begin monthly governance reporting

---

## Success Criteria

### Definition of Done

✅ Model registry operational with all existing models registered  
✅ Versioning and rollback tested and operational  
✅ Audit logs capturing all ML lifecycle events  
✅ Approval workflows enforced for all production deployments  
✅ Drift detection monitoring all production models  
✅ Governance dashboard accessible to stakeholders  
✅ Compliance evidence packs prepared and reviewed  
✅ Team trained on governance processes  
✅ Monthly reporting cadence established

---

## Appendices

### A. Glossary

- **Model Artifact:** The trained model file including weights, configuration, and preprocessing pipeline
- **Model Lineage:** The traceable history of a model including training data, code, and parent models
- **Drift:** Changes in data distribution or model performance over time
- **Semantic Versioning:** Version numbering scheme (MAJOR.MINOR.PATCH) indicating type of changes
- **Approval Workflow:** Multi-stage review process before model deployment
- **Rollback:** Reverting to a previous model version in production

### B. References

- Nigeria Data Protection Regulation (NDPR) 2019
- ISO/IEC 27001:2013 (Information Security Management)
- NIST AI Risk Management Framework
- EU AI Act (for international best practices)
- KOMPLEET Internal Risk Management Policy

---

**Document Control:**

| Version | Date       | Author             | Changes                     |
| ------- | ---------- | ------------------ | --------------------------- |
| 1.0     | 2026-02-06 | ML Governance Lead | Initial architecture design |

**Review Schedule:** Quarterly

**Next Review Date:** 2026-05-06

---

_This document is confidential and proprietary to Ivano Technologies Ltd._
