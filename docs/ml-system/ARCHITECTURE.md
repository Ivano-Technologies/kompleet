# KOMPLEET ML System Architecture
**Sprint 11-12: ML Categorization & Email Integration**

**Version:** 1.0  
**Date:** February 6, 2026  
**Author:** ML Lead + Backend Lead

---

## Executive Summary

This document defines the complete architecture for KOMPLEET's ML-based transaction categorization system integrated with Gmail and Outlook email auto-import. The system achieves 88%+ categorization accuracy, reduces manual categorization by 60%+, and maintains sub-500ms inference latency while ensuring full NDPR compliance.

---

## System Overview

### Architecture Principles

The ML system follows five core architectural principles. **Separation of Concerns** isolates training pipelines from inference services to enable independent scaling and deployment. **Privacy by Design** implements NDPR compliance at every layer with minimal data retention and user control. **Resilience** ensures graceful degradation when external services (Gmail, Outlook) fail. **Observability** provides comprehensive monitoring of accuracy, latency, and integration health. **Continuous Improvement** enables automated model retraining from user corrections.

### High-Level Components

The system comprises six major components. The **ML Training Pipeline** curates Nigerian transaction datasets, engineers features, trains Random Forest models, and evaluates performance against 88% accuracy targets. The **ML Inference Service** exposes /api/ai/categorize endpoints with sub-500ms latency, feature extraction, model versioning, and response caching. The **Email Integration Layer** implements OAuth flows for Gmail and Outlook, parses email content and attachments, extracts transactions and receipts, and manages secure token storage. The **Continuous Learning Pipeline** collects user corrections, aggregates training data, schedules periodic retraining, and deploys improved models. The **Recurring Transaction Detector** identifies payment patterns through frequency analysis, merchant matching, and amount pattern recognition. The **Feature Store** maintains engineered features including merchant normalization, transaction frequency, channel metadata, and historical patterns.

---

## ML Training Pipeline Architecture

### Data Collection and Curation

The training pipeline begins with extracting Nigerian transaction data from Supabase's transactions table including merchant names, amounts, categories, payment channels, timestamps, and user IDs. Data curation applies quality filters removing transactions with missing merchant names or categories, filtering outliers (amounts > 3 standard deviations), and deduplicating identical transactions within 24-hour windows. The pipeline enforces NDPR compliance by anonymizing user IDs in training data, obtaining explicit consent for ML training usage, and allowing users to opt out with automatic data removal.

### Feature Engineering

The feature engineering module transforms raw transactions into ML-ready features. **Merchant Features** normalize merchant names by removing special characters and converting to lowercase, extract merchant categories from name patterns (e.g., "restaurant", "pharmacy"), and compute merchant frequency per user. **Amount Features** log-transform amounts to handle wide ranges, bin amounts into categories (micro, small, medium, large), and calculate amount percentiles within user history. **Temporal Features** extract day of week, hour of day, day of month, and month of year, compute days since last similar transaction, and identify weekend vs weekday patterns. **Channel Features** one-hot encode payment channels (card, transfer, cash, mobile), track channel preference per user, and identify cross-channel patterns. **Historical Features** calculate category distribution for merchant, compute average amount for merchant-category pairs, and track user's category preferences.

### Model Training

The Random Forest classifier is trained with 200 trees, maximum depth of 20, minimum samples split of 10, and class weight balancing to handle imbalanced categories. The dataset is split into 70% training, 15% validation, and 15% test sets with stratification by category to maintain distribution. Hyperparameter tuning uses grid search over tree counts (100, 200, 300), max depths (15, 20, 25), and min samples split (5, 10, 15) with 5-fold cross-validation on the training set.

### Model Evaluation

Model performance is evaluated across multiple metrics. **Overall Metrics** include accuracy (target >= 88%), macro-averaged precision, recall, and F1 score. **Per-Category Metrics** ensure no category falls below 75% F1 score and identify categories requiring additional training data. **Confusion Matrix Analysis** reveals common misclassifications and guides feature engineering improvements. **Baseline Comparison** benchmarks against rules-based categorization to validate ML improvement.

### Model Versioning and Storage

Trained models are versioned using semantic versioning (MAJOR.MINOR.PATCH) where MAJOR increments for breaking changes (feature schema changes), MINOR increments for performance improvements, and PATCH increments for bug fixes. Models are serialized using joblib with compression, stored in Supabase Storage with encryption at rest, and registered in the ML Governance Model Registry with complete metadata including training date, dataset size, feature schema version, evaluation metrics, and training hyperparameters.

---

## ML Inference Service Architecture

### API Endpoint Design

The inference service exposes a RESTful endpoint at POST /api/ai/categorize accepting JSON payloads with merchant name (required), amount (required), channel (optional), timestamp (optional), and user_id (required for personalization). The response includes predicted category, confidence score (0-1), alternative categories with scores, and inference_id for tracking. Error responses follow standard HTTP status codes with detailed error messages.

### Feature Extraction Pipeline

Incoming transactions are processed through the same feature engineering pipeline used in training to ensure consistency. The extraction pipeline normalizes merchant names, computes temporal features from timestamps, encodes payment channels, retrieves user historical features from the feature store, and assembles the feature vector matching the model's expected schema.

### Model Loading and Caching

The inference service loads the active model version at startup from Supabase Storage, caches the model in memory for fast inference, and monitors for model version updates with hot-swapping capability. Model metadata including version, feature schema, and performance metrics are loaded alongside the model.

### Inference Execution

Inference executes in three steps. **Feature Validation** verifies all required features are present and within expected ranges. **Model Prediction** applies the Random Forest classifier to the feature vector and extracts probability scores for all categories. **Post-Processing** selects the highest-confidence category, filters alternative categories above 0.1 confidence threshold, and formats the response with category names and scores.

### Response Caching

Frequently predicted transactions are cached to reduce latency and computational cost. The cache key is computed as a hash of normalized merchant name, amount bucket, and channel. Cache entries have a 24-hour TTL and are invalidated when model versions change. Caching is only applied when confidence exceeds 0.9 to avoid caching uncertain predictions.

### Rate Limiting

Per-user rate limiting prevents abuse and ensures fair resource allocation. Limits are set at 100 requests per minute per user for authenticated requests and 10 requests per minute per IP for unauthenticated requests. Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) are included in responses.

### Performance Optimization

The inference service achieves sub-500ms p95 latency through multiple optimizations. **Model Optimization** uses scikit-learn's optimized Random Forest implementation and limits tree depth to balance accuracy and speed. **Feature Store** pre-computes user historical features and caches them with 1-hour TTL. **Async Processing** handles feature retrieval asynchronously where possible. **Connection Pooling** maintains persistent database connections. **Horizontal Scaling** enables multiple inference service instances behind a load balancer.

---

## Email Integration Architecture

### OAuth 2.0 Implementation

Both Gmail and Outlook integrations use OAuth 2.0 authorization code flow with PKCE for enhanced security. The OAuth flow follows these steps: user clicks "Connect Gmail/Outlook" button, application redirects to provider's authorization URL with scopes and PKCE challenge, user grants permissions on provider's consent screen, provider redirects back with authorization code, application exchanges code for access and refresh tokens using PKCE verifier, and tokens are encrypted and stored in Supabase.

### Gmail API Integration

The Gmail integration uses Google Cloud Console project with OAuth 2.0 credentials and configured consent screen. Required OAuth scopes are gmail.readonly (read email messages and attachments) and gmail.labels (read labels for filtering). The integration polls for new emails every 15 minutes using the Gmail API's messages.list endpoint with label filters for receipts and transactions, retrieves full message content including attachments, and parses email body and attachments to extract transaction data.

### Outlook API Integration

The Outlook integration uses Azure AD app registration with Microsoft Graph API permissions. Required OAuth scopes are Mail.Read (read user's email) and offline_access (maintain access via refresh tokens). The integration uses Microsoft Graph API's /me/messages endpoint with $filter for date ranges and keywords, retrieves message content and attachments, and parses email body and attachments to extract transaction data.

### Email Parsing Service

The email parsing service extracts transaction data from email content using pattern matching and natural language processing. **Receipt Detection** identifies emails containing receipts through subject line patterns (receipt, invoice, payment confirmation), sender domain patterns (known merchants, payment processors), and content patterns (amount, date, merchant name). **Transaction Extraction** uses regex patterns to extract merchant names, transaction amounts, dates, and payment methods. **Attachment Processing** extracts text from PDF receipts using OCR, parses CSV/Excel attachments from banks, and processes image receipts with text recognition. **Data Validation** verifies extracted amounts are valid numbers, dates are within reasonable ranges, and merchant names are non-empty.

### Token Management

OAuth tokens are managed securely throughout their lifecycle. **Token Storage** encrypts access and refresh tokens using AES-256, stores tokens in Supabase with user association, and never logs or exposes tokens in responses. **Token Refresh** automatically refreshes expired access tokens using refresh tokens, handles refresh token expiration by prompting re-authentication, and implements exponential backoff for retry logic. **Token Revocation** allows users to disconnect email accounts at any time, revokes tokens with the provider's revocation endpoint, and deletes stored tokens from the database.

### Error Handling and Resilience

The email integration implements robust error handling for various failure scenarios. **API Rate Limits** respect provider rate limits with exponential backoff, queue requests when limits are reached, and notify users of temporary unavailability. **Network Failures** retry failed requests up to 3 times with exponential backoff, fall back to cached data when available, and log failures for monitoring. **Authentication Failures** detect expired or revoked tokens, prompt users to re-authenticate, and gracefully disable integration until reconnected. **Parsing Failures** log unparseable emails for analysis, skip malformed content without crashing, and collect examples for improving parsing rules.

---

## Continuous Learning Pipeline Architecture

### Correction Collection

User corrections are collected whenever users manually change an ML-predicted category. The correction event captures the original transaction data, ML-predicted category and confidence, user-corrected category, user ID, and timestamp. Corrections are stored in a dedicated ml_corrections table in Supabase for analysis and retraining.

### Retraining Triggers

Model retraining is triggered by multiple conditions. **Scheduled Retraining** runs weekly on Sundays at 2 AM UTC to incorporate accumulated corrections. **Threshold-Based Retraining** triggers when correction count exceeds 1000 since last training or accuracy drops below 85% in online monitoring. **Manual Retraining** allows ML team to trigger retraining on demand for urgent improvements.

### Retraining Pipeline

The retraining pipeline follows the same process as initial training with additional correction data. **Data Aggregation** combines original training data with new transactions and user corrections, applies the same quality filters and deduplication, and balances classes to prevent bias toward corrected categories. **Model Training** trains a new model version with the expanded dataset, evaluates performance on held-out test set, and compares against the current production model. **Model Validation** ensures new model meets 88% accuracy threshold, verifies no category drops below 75% F1 score, and tests for performance regressions on historical data. **Model Deployment** deploys new model only if it outperforms current model, implements blue-green deployment for zero-downtime updates, and maintains rollback capability to previous version.

### Feedback Loop Monitoring

The continuous learning pipeline tracks key metrics to ensure improvement over time. **Correction Rate** measures percentage of predictions requiring user correction (target < 15%). **Category-Specific Correction Rates** identify categories with high correction rates needing improvement. **Correction Velocity** tracks corrections per day to detect data quality issues. **Model Improvement** measures accuracy gain from each retraining cycle.

---

## Recurring Transaction Detection Architecture

### Detection Algorithm

The recurring transaction detector identifies payment patterns through multi-dimensional analysis. **Frequency Analysis** groups transactions by merchant and user, calculates time intervals between transactions, identifies regular intervals (daily, weekly, bi-weekly, monthly, quarterly), and allows 20% tolerance for interval variation. **Merchant Matching** normalizes merchant names for comparison, uses fuzzy matching (Levenshtein distance) for slight variations, and groups merchants by domain for online transactions. **Amount Pattern Matching** identifies fixed-amount transactions (variation < 5%), variable-amount transactions with consistent range, and increasing/decreasing patterns (subscriptions with price changes).

### Pattern Confidence Scoring

Each detected recurring pattern receives a confidence score based on multiple factors. **Frequency Consistency** scores higher for more consistent intervals (score = 1 - coefficient_of_variation). **Sample Size** requires minimum 3 occurrences for pattern detection and increases confidence with more samples. **Recency** weights recent transactions higher than old transactions. **Amount Consistency** scores higher for fixed amounts than variable amounts. The overall confidence score is a weighted average of these factors with a threshold of 0.7 for displaying recurring badges in the UI.

### Pattern Storage and Updates

Detected patterns are stored in a recurring_patterns table with merchant name, user ID, interval (days), amount (mean and std dev), confidence score, last occurrence date, and next expected date. Patterns are updated incrementally as new transactions arrive, checking if new transactions match existing patterns, updating pattern statistics with new data points, and removing patterns when expected transactions don't occur for 2x the interval.

---

## Feature Store Architecture

### Feature Categories

The feature store maintains pre-computed features for fast inference. **Merchant Features** include normalized merchant names, merchant category mappings, merchant frequency per user, and average amounts per merchant. **User Features** track category distribution preferences, average transaction amounts by category, preferred payment channels, and transaction frequency patterns. **Temporal Features** compute day-of-week distributions, hour-of-day distributions, and seasonal patterns. **Historical Features** maintain recent transaction history (last 30 days), category transition probabilities, and merchant-category associations.

### Feature Computation

Features are computed through batch and streaming pipelines. **Batch Computation** runs nightly to recompute all user features from historical data, updates merchant statistics across all users, and refreshes category distributions. **Streaming Computation** updates features incrementally as new transactions arrive, maintains rolling windows for recent history, and invalidates cached features when updates occur.

### Feature Storage

Features are stored in Supabase with efficient access patterns. **User Features Table** stores one row per user with JSON columns for feature vectors and indexes on user_id for fast lookup. **Merchant Features Table** stores one row per merchant with normalization mappings and category associations. **Feature Cache** uses Redis for sub-10ms feature retrieval with 1-hour TTL and automatic refresh on cache miss.

---

## Security and Privacy Architecture

### NDPR Compliance

The ML system implements comprehensive NDPR compliance measures. **Lawful Basis** establishes legitimate interest for transaction categorization and explicit consent for email data processing. **Data Minimization** collects only necessary transaction fields for categorization, anonymizes user IDs in training data, and deletes raw email content after extraction. **Purpose Limitation** uses email data only for transaction extraction, never for marketing or other purposes, and documents purpose in privacy policy. **User Rights** enables users to opt out of ML training, request deletion of their data, and access their stored corrections. **Consent Management** displays clear consent screens before email connection, explains data usage in plain language, and allows revocation at any time.

### Data Encryption

All sensitive data is encrypted at rest and in transit. **At Rest** encryption uses AES-256 for OAuth tokens, database-level encryption for Supabase tables, and encrypted storage for model artifacts. **In Transit** encryption uses TLS 1.3 for all API communications, HTTPS for OAuth redirects, and encrypted connections to external APIs.

### Access Controls

Strict access controls protect ML system components. **API Authentication** requires JWT tokens for all /api/ai/categorize requests, validates user identity before feature retrieval, and enforces per-user rate limits. **Model Access** restricts model artifacts to authorized service accounts, requires authentication for model downloads, and logs all model access events. **Email Token Access** isolates tokens per user with no cross-user access, encrypts tokens before storage, and requires user authentication for token operations.

### Audit Logging

Comprehensive audit logs track all ML system activities. **Inference Logging** records every categorization request with user ID, transaction data hash, predicted category, confidence score, and timestamp. **Correction Logging** captures all user corrections with original prediction and corrected category. **Email Access Logging** logs all email API calls with user ID, provider, timestamp, and success/failure status. **Model Deployment Logging** records model version changes, deployment timestamps, and deploying user. All logs are retained for 7 years per NDPR requirements and made available for audit purposes.

---

## Monitoring and Observability Architecture

### Key Metrics

The ML system tracks comprehensive metrics across multiple dimensions. **Accuracy Metrics** include online accuracy (predictions vs corrections), offline accuracy (test set evaluation), per-category F1 scores, and confusion matrix analysis. **Performance Metrics** track inference latency (p50, p95, p99), feature retrieval latency, cache hit rate, and request throughput. **Integration Metrics** measure email import success rate, OAuth connection success rate, token refresh success rate, and email parsing accuracy. **Business Metrics** calculate manual categorization reduction percentage, user adoption of email auto-import, recurring transaction detection precision, and user satisfaction scores.

### Alerting Rules

Automated alerts notify the team of critical issues. **Accuracy Alerts** trigger when overall accuracy drops below 85%, any category F1 drops below 70%, or correction rate exceeds 20%. **Performance Alerts** trigger when p95 latency exceeds 500ms, cache hit rate drops below 80%, or error rate exceeds 1%. **Integration Alerts** trigger when email API error rate exceeds 5%, OAuth token refresh failures exceed 2%, or email parsing failures exceed 10%. **Security Alerts** trigger on unusual access patterns, failed authentication attempts exceeding threshold, or suspicious data access.

### Dashboards

Real-time dashboards provide visibility into system health. **ML Performance Dashboard** displays current accuracy, recent predictions with confidence distribution, per-category performance breakdown, and correction rate trends. **Integration Health Dashboard** shows email connection status by provider, recent import success rates, OAuth token health, and parsing error examples. **System Performance Dashboard** visualizes inference latency percentiles, cache performance metrics, request volume and throughput, and error rates by type.

---

## Deployment Architecture

### Infrastructure

The ML system deploys on KOMPLEET's existing Next.js + Supabase infrastructure. **Inference Service** runs as Next.js API routes with serverless functions for auto-scaling and edge deployment for low latency. **Training Pipeline** executes as scheduled background jobs using Supabase Edge Functions or external compute (e.g., AWS Lambda). **Feature Store** uses Supabase PostgreSQL for persistent storage and Redis for caching. **Model Storage** uses Supabase Storage for encrypted model artifacts.

### Deployment Strategy

New model versions deploy using blue-green deployment for zero downtime. **Blue Environment** runs the current production model serving all traffic. **Green Environment** deploys the new model version in parallel without traffic. **Validation** runs smoke tests and canary traffic (5%) on green environment. **Cutover** switches all traffic to green environment if validation passes. **Rollback** reverts to blue environment if issues detected within 1 hour.

### Feature Flags

The ML system uses feature flags for gradual rollout and risk mitigation. **ML Categorization Flag** enables/disables ML predictions with fallback to rules-based categorization. **Email Integration Flags** separate flags for Gmail and Outlook enable independent rollout. **Continuous Learning Flag** controls whether user corrections trigger retraining. **Recurring Detection Flag** enables/disables recurring transaction badges. Flags are managed through environment variables with per-user overrides for beta testing.

---

## API Specifications

### POST /api/ai/categorize

**Request:**
```json
{
  "merchant": "Shoprite Lagos",
  "amount": 15000,
  "channel": "card",
  "timestamp": "2026-02-06T10:30:00Z",
  "user_id": "user_123"
}
```

**Response (Success):**
```json
{
  "category": "Groceries",
  "confidence": 0.92,
  "alternatives": [
    {"category": "Shopping", "confidence": 0.05},
    {"category": "Food & Dining", "confidence": 0.03}
  ],
  "inference_id": "inf_abc123",
  "model_version": "1.2.0"
}
```

**Response (Error):**
```json
{
  "error": "Invalid request",
  "message": "Missing required field: merchant",
  "code": "INVALID_REQUEST"
}
```

### POST /api/email/connect/gmail

Initiates Gmail OAuth flow.

**Request:**
```json
{
  "redirect_uri": "https://kompleet.app/email/callback"
}
```

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "state_token_xyz"
}
```

### POST /api/email/connect/outlook

Initiates Outlook OAuth flow.

**Request:**
```json
{
  "redirect_uri": "https://kompleet.app/email/callback"
}
```

**Response:**
```json
{
  "authorization_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...",
  "state": "state_token_xyz"
}
```

### GET /api/email/status

Returns email connection status.

**Response:**
```json
{
  "gmail": {
    "connected": true,
    "email": "user@gmail.com",
    "last_sync": "2026-02-06T10:00:00Z"
  },
  "outlook": {
    "connected": false
  }
}
```

### DELETE /api/email/disconnect/{provider}

Disconnects email account.

**Response:**
```json
{
  "success": true,
  "message": "Gmail account disconnected successfully"
}
```

---

## Database Schema

### ml_models Table
```sql
CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  storage_path TEXT NOT NULL,
  feature_schema JSONB NOT NULL,
  metrics JSONB NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP
);
```

### ml_inferences Table
```sql
CREATE TABLE ml_inferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  model_version VARCHAR(20) NOT NULL,
  transaction_hash VARCHAR(64) NOT NULL,
  predicted_category VARCHAR(100) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  alternatives JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_inferences_user ON ml_inferences(user_id);
CREATE INDEX idx_inferences_created ON ml_inferences(created_at);
```

### ml_corrections Table
```sql
CREATE TABLE ml_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  inference_id UUID REFERENCES ml_inferences(id),
  transaction_data JSONB NOT NULL,
  predicted_category VARCHAR(100) NOT NULL,
  corrected_category VARCHAR(100) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_corrections_user ON ml_corrections(user_id);
CREATE INDEX idx_corrections_created ON ml_corrections(created_at);
```

### email_connections Table
```sql
CREATE TABLE email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider VARCHAR(20) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
CREATE INDEX idx_email_connections_user ON email_connections(user_id);
```

### recurring_patterns Table
```sql
CREATE TABLE recurring_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  merchant_normalized VARCHAR(255) NOT NULL,
  interval_days INTEGER NOT NULL,
  amount_mean DECIMAL(12,2) NOT NULL,
  amount_stddev DECIMAL(12,2) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  last_occurrence_date DATE NOT NULL,
  next_expected_date DATE NOT NULL,
  occurrence_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_recurring_user ON recurring_patterns(user_id);
CREATE INDEX idx_recurring_next_date ON recurring_patterns(next_expected_date);
```

### user_features Table
```sql
CREATE TABLE user_features (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  feature_vector JSONB NOT NULL,
  category_distribution JSONB NOT NULL,
  preferred_channels JSONB NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

### merchant_features Table
```sql
CREATE TABLE merchant_features (
  merchant_normalized VARCHAR(255) PRIMARY KEY,
  category_mapping VARCHAR(100),
  transaction_count INTEGER NOT NULL DEFAULT 0,
  average_amount DECIMAL(12,2),
  last_updated TIMESTAMP DEFAULT NOW()
);
```

---

## Testing Strategy

### Unit Tests

Unit tests cover individual components in isolation. **Feature Engineering** tests merchant normalization, amount binning, temporal feature extraction, and channel encoding. **Model Inference** tests feature vector assembly, prediction execution, and confidence score calculation. **Email Parsing** tests receipt detection patterns, transaction extraction regex, and attachment processing. **Recurring Detection** tests interval calculation, pattern matching, and confidence scoring.

### Integration Tests

Integration tests verify component interactions. **OAuth Flows** test complete Gmail and Outlook authorization flows, token exchange and storage, and token refresh logic. **End-to-End Categorization** tests transaction submission, feature retrieval, model inference, and response formatting. **Email Import** tests email fetching, parsing, transaction extraction, and database storage. **Continuous Learning** tests correction collection, retraining trigger, and model deployment.

### Load Tests

Load tests ensure performance under stress. **Inference Load** simulates 1000 concurrent categorization requests and verifies p95 latency < 500ms. **Email Sync Load** tests concurrent email imports for 100 users. **Feature Store Load** tests feature retrieval under high concurrency.

### A/B Testing

A/B tests compare ML categorization against rules-based baseline. **Test Setup** randomly assigns 50% of users to ML and 50% to rules-based categorization. **Metrics Tracked** include categorization accuracy, manual override rate, user satisfaction, and time spent categorizing. **Success Criteria** require ML to achieve 60%+ reduction in manual categorization and 88%+ accuracy.

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)

Deploy ML system to staging environment, test with internal team members (10 users), validate accuracy and performance metrics, and fix critical bugs.

### Phase 2: Beta Rollout (Week 2)

Enable ML categorization for 100 beta users via feature flag, monitor accuracy and correction rates daily, collect user feedback on prediction quality, and iterate on model and features.

### Phase 3: Email Integration Beta (Week 3)

Enable Gmail integration for 50 beta users, enable Outlook integration for 50 beta users, monitor OAuth success rates and email parsing accuracy, and address integration issues.

### Phase 4: General Availability (Week 4)

Roll out ML categorization to all users, enable email integrations for all users, monitor system health and user adoption, and prepare for continuous learning cycle.

---

## Success Criteria

The Sprint 11-12 implementation is considered successful when all criteria are met:

- ✅ ML categorization accuracy >= 88% overall
- ✅ No category F1 score below 75%
- ✅ Inference p95 latency < 500ms
- ✅ Manual categorization reduced by >= 60%
- ✅ Gmail OAuth integration functional
- ✅ Outlook OAuth integration functional
- ✅ Email import success rate >= 95%
- ✅ Continuous learning pipeline operational
- ✅ Recurring transaction detection live
- ✅ NDPR compliance verified
- ✅ Monitoring and alerts configured
- ✅ Documentation complete

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Next Review:** End of Sprint 11-12

*This architecture document guides the implementation of KOMPLEET's ML categorization and email integration system.*
