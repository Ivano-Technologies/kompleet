# Phase 0: Discovery & Design Alignment
## Unified Bank Statement Ingestion Engine

**Date:** February 18, 2026  
**Status:** PLANNING  
**Scope:** Web + Mobile, PDF/Excel/CSV/ZIP with encryption support

---

## 1. UNIFIED ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          KOMPLEET INGESTION PIPELINE                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Web + Mobile)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐        ┌──────────────────────────────────┐   │
│  │   Upload Entry Screen   │        │   Encryption Detected Modal      │   │
│  ├─────────────────────────┤        ├──────────────────────────────────┤   │
│  │ • Drag-and-drop zone    │───────▶│ • Password input field           │   │
│  │ • Browse button         │        │ • Show/hide toggle              │   │
│  │ • Format hints          │        │ • Submit button                 │   │
│  │ • Security microcopy    │        │ • Error state (wrong password)  │   │
│  └─────────────────────────┘        └──────────────────────────────────┘   │
│           │                                    │                            │
│           └────────────────────────────────────┘                            │
│                        │                                                    │
│                        ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Upload Progress & State Machine                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ • Uploading file → Unlocking → Reading → Preparing                 │   │
│  │ • Progress bar + step labels                                        │   │
│  │ • Cancel button                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                        │                                                    │
│                        ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │            Success / Failure State Handlers                         │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ SUCCESS: "Found 47 transactions" → Review & Categorize             │  │
│  │ FAILURE: "Couldn't read file" → Retry / Contact Support           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (HTTPS POST)
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API LAYER                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │            POST /api/ingest (File + Optional Password)            │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │ • Validate MIME type + file size                                  │    │
│  │ • Delegate to ingestion worker                                    │    │
│  │ • Return: { status, transactionCount, errors, aiJobId }         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │         Ingestion Worker (Sandboxed Process)                      │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                    │    │
│  │  1. detectFileType(buffer) → 'pdf' | 'xlsx' | 'csv' | 'zip'      │    │
│  │                                                                    │    │
│  │  2. detectEncryption(buffer, fileType)                           │    │
│  │     → { isEncrypted: bool, encryptionType?: string }             │    │
│  │                                                                    │    │
│  │  3. IF encrypted → decrypt(buffer, password)                     │    │
│  │     → decryptedBuffer (in-memory only)                           │    │
│  │                                                                    │    │
│  │  4. Parse(decryptedBuffer, fileType)                             │    │
│  │     → rawRows: { date, description, amount, balance, ref }[]     │    │
│  │                                                                    │    │
│  │  5. normalizeTransactions(rawRows)                               │    │
│  │     → transactions: Transaction[] (canonical schema)              │    │
│  │                                                                    │    │
│  │  6. deduplicateTransactions(transactions)                        │    │
│  │     → dedupedTransactions (by date + amount + desc hash)         │    │
│  │                                                                    │    │
│  │  7. validateTransactions(dedupedTransactions)                    │    │
│  │     → { valid: Transaction[], errors: ValidationError[] }        │    │
│  │                                                                    │    │
│  │  8. sanitizeForAI(validTransactions)                             │    │
│  │     → sanitized: { date, description, amount, currency }[]       │    │
│  │                                                                    │    │
│  │  9. deleteRawFile(uploadedFile)                                  │    │
│  │     → ephemeral storage cleaned up                               │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │           Persistence Layer (Supabase)                            │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │ • INSERT transactions INTO transactions_table                     │    │
│  │ • INSERT source_file metadata                                    │    │
│  │ • AUDIT LOG: upload success/failure (no sensitive data)          │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AI CATEGORIZATION LAYER                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │     Async AI Categorization Job (Triggered after ingestion)       │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                    │    │
│  │  FOR EACH sanitized transaction:                                  │    │
│  │                                                                    │    │
│  │  1. Check merchant → category learning rules                     │    │
│  │     IF match found → apply rule (high confidence)                │    │
│  │                                                                    │    │
│  │  2. IF no rule match → call LLM categorizer                      │    │
│  │     → { category, confidence, reasoning }                        │    │
│  │                                                                    │    │
│  │  3. Apply confidence thresholds:                                 │    │
│  │     • confidence > 0.85 → AUTO_APPLY                             │    │
│  │     • 0.65-0.85 → SUGGEST (user review)                          │    │
│  │     • < 0.65 → MANUAL_REVIEW (flag for user)                     │    │
│  │                                                                    │    │
│  │  4. UPDATE transaction WITH category + confidence                │    │
│  │                                                                    │    │
│  │  5. Emit event: "categorization_complete"                        │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   USER REVIEW & FEEDBACK LOOP                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │       Transaction Review Screen (Web + Mobile)                    │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │ • List transactions with AI-assigned categories                   │    │
│  │ • Confidence indicator (low/medium/high)                          │    │
│  │ • Inline edit dropdown for category                               │    │
│  │ • Bulk edit for multiple transactions                             │    │
│  │ • "Why this category?" tooltip                                    │    │
│  │ • Submit corrections button                                       │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │       User Correction Feedback Loop                               │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │ • POST /api/transactions/{id}/correct-category                    │    │
│  │ • Store: { transactionId, originalCategory, correctedCategory }  │    │
│  │ • Learn: merchant → corrected_category mapping                    │    │
│  │ • Apply to future transactions with same merchant                 │    │
│  │ • Track accuracy improvements over time                           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DEPENDENCY MAP

### Layer Dependencies

```
FRONTEND LAYER
  ├─ Upload UI Components
  │   └─ Depends on: API /api/ingest
  │
  ├─ Password Prompt Modal
  │   └─ Depends on: API /api/ingest (password parameter)
  │
  └─ Upload Progress & State Machine
      └─ Depends on: API /api/ingest (status polling)

API LAYER
  ├─ POST /api/ingest
  │   ├─ Depends on: Ingestion Worker
  │   └─ Depends on: Supabase (transaction persistence)
  │
  └─ Ingestion Worker
      ├─ Depends on: detectFileType.ts
      ├─ Depends on: detectEncryption.ts
      ├─ Depends on: parsePdf.ts, parseExcel.ts, parseCsv.ts, parseZip.ts
      ├─ Depends on: normalizeTransactions.ts
      ├─ Depends on: deduplicate.ts
      ├─ Depends on: sanitizeForAI.ts
      └─ Depends on: Supabase (audit logging)

AI CATEGORIZATION LAYER
  ├─ Categorization Service
  │   ├─ Depends on: Ingestion Worker (normalized transactions)
  │   ├─ Depends on: LLM API (OpenAI)
  │   ├─ Depends on: Merchant Learning Rules Engine
  │   └─ Depends on: Supabase (category storage)
  │
  └─ User Feedback Loop
      ├─ Depends on: Categorization Service
      ├─ Depends on: Frontend UI (correction submission)
      └─ Depends on: Merchant Learning Rules Engine

FRONTEND REVIEW LAYER
  ├─ Transaction Review UI
  │   ├─ Depends on: Categorization Service (categories + confidence)
  │   └─ Depends on: API /api/transactions/{id}/correct-category
  │
  └─ Correction Submission
      └─ Depends on: User Feedback Loop
```

### Critical Path

```
Phase 1 (BLOCKING):
  detectFileType → detectEncryption → Parse → Normalize → Deduplicate → Validate

Phase 2 (DEPENDS ON Phase 1):
  Frontend Upload UI → API /api/ingest → Ingestion Worker

Phase 3 (DEPENDS ON Phase 1 + 2):
  Categorization Service → Confidence Thresholds → User Feedback Loop
```

---

## 3. RISK REGISTER

| ID | Risk | Severity | Probability | Impact | Mitigation |
|----|------|----------|-------------|--------|-----------|
| **R-001** | Password sent in plaintext over HTTPS | HIGH | MEDIUM | Data breach | Use TLS 1.3+, rate-limit password attempts, never log passwords |
| **R-002** | Encrypted file decryption fails silently | HIGH | MEDIUM | User confusion | Explicit error messages, retry flow without re-upload |
| **R-003** | LLM receives sensitive data (account numbers, names) | HIGH | HIGH | Privacy violation | Implement sanitizeForAI() before sending to LLM |
| **R-004** | Large file uploads cause memory overflow | MEDIUM | MEDIUM | Service crash | Implement streaming parsers, file size limits (100MB max) |
| **R-005** | Duplicate detection O(n²) timeout on large batches | MEDIUM | MEDIUM | Upload timeout | Use LSH bucketing for >1000 transactions |
| **R-006** | AI categorization mistakes impact tax accuracy | HIGH | HIGH | User trust loss | Confidence thresholds, user review required for <0.65, feedback loop |
| **R-007** | Malformed CSV/Excel causes parser crash | MEDIUM | HIGH | Service crash | Try-catch all parsers, return graceful error |
| **R-008** | User loses password before upload completes | LOW | MEDIUM | Retry friction | Store password in session (encrypted), allow retry without re-upload |
| **R-009** | Audit logs expose sensitive transaction data | HIGH | MEDIUM | Compliance violation | Log only: file type, upload status, transaction count (no content) |
| **R-010** | Mobile app cannot handle large file uploads | MEDIUM | MEDIUM | Mobile UX broken | Test with 50MB+ files, implement chunked upload if needed |

---

## 4. MILESTONE TIMELINE

### Phase 0: Discovery & Design Alignment (THIS WEEK)
- **Duration:** 1 day
- **Deliverables:**
  - ✅ Architecture diagram (above)
  - ✅ Dependency map (above)
  - ✅ Risk register (above)
  - ✅ Success metrics (below)
  - ✅ Milestone timeline (this section)
- **Exit Criteria:** All stakeholders aligned on architecture and risks

### Phase 1: Core Ingestion Infrastructure (WEEK 1-2)
- **Duration:** 3-4 days
- **Deliverables:**
  - File type detection (detectFileType.ts)
  - Encryption detection (detectEncryption.ts)
  - PDF parser (parsePdf.ts)
  - Excel parser (parseExcel.ts)
  - CSV parser (parseCsv.ts)
  - ZIP parser (parseZip.ts)
  - Normalization (normalizeTransactions.ts)
  - Deduplication (deduplicate.ts)
  - Sanitization (sanitizeForAI.ts)
  - API endpoint (/api/ingest)
  - Unit tests (parsers, normalization, encryption)
- **Exit Criteria:**
  - ✅ Password-protected PDF and Excel parse successfully
  - ✅ Wrong passwords handled gracefully
  - ✅ Raw files deleted after parsing
  - ✅ No passwords logged or stored
  - ✅ All tests passing

### Phase 2: Upload UX (Web + Mobile) (WEEK 2-3)
- **Duration:** 2-3 days
- **Deliverables:**
  - Upload entry screen (UploadWidget.tsx)
  - Encryption detected modal (PasswordPrompt.tsx)
  - Progress state machine (UploadStatus.tsx)
  - Success/failure states
  - Mobile compatibility
  - Security microcopy
  - Integration tests (frontend ↔ API)
- **Exit Criteria:**
  - ✅ User can upload encrypted file without re-uploading
  - ✅ Wrong password retry works
  - ✅ UX clearly communicates security and progress
  - ✅ Mobile and desktop flows work

### Phase 3: AI Categorization + Feedback Loop (WEEK 3-4)
- **Duration:** 3-4 days
- **Deliverables:**
  - Categorization service (categorizeTransaction.ts)
  - Confidence scoring logic
  - Confidence thresholds (0.65, 0.85)
  - User correction persistence (API endpoint)
  - Merchant learning rules engine
  - Bulk recategorization
  - Admin analytics dashboard
  - Integration tests (AI ↔ feedback loop)
- **Exit Criteria:**
  - ✅ Low-confidence results flagged for review
  - ✅ User corrections improve future categorization
  - ✅ High-confidence results reduce user workload
  - ✅ No sensitive data exposed to AI

### Phase 4: Hardening, QA & Rollout (WEEK 4-5)
- **Duration:** 2-3 days
- **Deliverables:**
  - Security audit (passwords, data handling)
  - Performance testing (large files, bulk operations)
  - Edge case testing (corrupt files, timeouts, wrong passwords)
  - Contributor documentation (README.md)
  - Feature flags for gradual rollout
  - Rollback strategy and testing
  - End-to-end test suite
- **Exit Criteria:**
  - ✅ All critical paths covered by tests
  - ✅ Security checklist verified
  - ✅ Feature can be safely rolled out incrementally
  - ✅ Rollback plan tested

---

## 5. SUCCESS METRICS

### Upload Success Rate
- **Baseline:** Current upload failure rate (from logs)
- **Target:** >95% success rate for supported formats
- **Measurement:** (successful_uploads / total_uploads) × 100
- **Tracking:** Dashboard metric, daily reporting

### Encryption Handling
- **Target:** 100% of password-protected files handled without re-upload
- **Measurement:** (successful_password_retries / total_password_attempts) × 100
- **Tracking:** Audit logs, weekly review

### AI Categorization Accuracy
- **Baseline:** Initial LLM accuracy (measure after Phase 3)
- **Target:** >85% accuracy for high-confidence results (>0.85)
- **Measurement:** (correct_categories / total_categorized) × 100
- **Tracking:** User correction rate, feedback loop metrics

### User Correction Rate
- **Target:** <15% of transactions require user correction
- **Measurement:** (user_corrections / total_categorized) × 100
- **Tracking:** Dashboard analytics, monthly review

### System Reliability
- **Target:** <1% parsing errors for valid files
- **Measurement:** (parsing_errors / total_uploads) × 100
- **Tracking:** Error logs, weekly review

### Security Compliance
- **Target:** 0 password leaks, 0 sensitive data in logs
- **Measurement:** Security audit checklist, log analysis
- **Tracking:** Manual review, automated log scanning

### Performance
- **Target:** <5 seconds for PDF parsing (up to 50MB)
- **Measurement:** Average parse time by file size
- **Tracking:** Performance monitoring, weekly review

### User Satisfaction
- **Target:** >4.5/5 stars for upload experience
- **Measurement:** In-app feedback survey
- **Tracking:** Weekly surveys, monthly aggregation

---

## 6. QUALITY GATES (Non-Negotiable)

### Security Gates
- [ ] No passwords in logs or database
- [ ] No raw files sent to AI
- [ ] Decryption only in memory
- [ ] Raw files auto-deleted after parse
- [ ] Audit logging without sensitive data
- [ ] HTTPS only for password transmission

### Functional Gates
- [ ] Password-protected PDF and Excel parse successfully
- [ ] Wrong passwords handled gracefully (no re-upload)
- [ ] Parsing works for Nigerian bank statement formats
- [ ] AI confidence thresholds enforced
- [ ] System is idempotent and resilient to retries

### UX Gates
- [ ] Upload flow does not require technical troubleshooting
- [ ] Password prompt appears immediately (no delay)
- [ ] Progress states are clear and responsive
- [ ] Error messages guide users to solutions
- [ ] Mobile and desktop flows are equivalent

### Testing Gates
- [ ] All critical paths covered by tests
- [ ] Edge cases tested (corrupt files, wrong passwords, timeouts)
- [ ] Performance tested for large files (50MB+)
- [ ] Security checklist verified
- [ ] Rollback plan tested

---

## 7. ASSUMPTIONS & CONSTRAINTS

### Assumptions
1. Supabase is available and configured for transaction persistence
2. OpenAI API is available for LLM categorization
3. Users have access to their file passwords (for encrypted files)
4. Nigerian bank statement formats are relatively consistent
5. Mobile app uses same API endpoints as web

### Constraints
1. **File Size Limit:** 100MB max per upload
2. **Processing Time:** <5 seconds for PDF parsing
3. **Password Attempts:** Max 3 attempts before lockout
4. **Retention:** Raw files deleted within 10 minutes of parsing
5. **Compliance:** No sensitive data in logs or database

---

## 8. NEXT STEPS

1. **Stakeholder Review** - Share this document with product, engineering, security teams
2. **Risk Mitigation Planning** - Assign owners to high-severity risks
3. **Resource Allocation** - Confirm team availability for Phase 1
4. **Infrastructure Check** - Verify Supabase, OpenAI API, file storage setup
5. **Proceed to Phase 1** - Once Phase 0 is approved

---

**Document Status:** READY FOR REVIEW  
**Prepared by:** Manus AI  
**Date:** February 18, 2026
