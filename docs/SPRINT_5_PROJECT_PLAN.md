# Sprint 5: Transaction Management System
## Comprehensive Project Plan

**Project:** KOMPLEET Platform - Transaction Upload & Parsing Module  
**Sprint:** Sprint 5 (Critical Path)  
**Duration:** 2 Weeks (10 Working Days)  
**Start Date:** February 10, 2026  
**End Date:** February 21, 2026  
**Project Manager:** Kezie (Product Manager)  
**Status:** Not Started  
**Priority:** P0 (Critical Blocker)

---

## Executive Summary

Sprint 5 implements the Transaction Management System, the most critical blocker preventing KOMPLEET MVP launch. This sprint delivers CSV/Excel bank statement upload, transaction normalization for 10+ Nigerian banks, duplicate detection, balance validation, and import history tracking. Without these capabilities, users cannot import real financial data, rendering the platform unusable for production.

**Business Impact:** Unblocks ₦7.8M MRR revenue potential and enables beta user onboarding (target: 100 users).

**Success Criteria:**
- Users can upload CSV/Excel files from 10+ Nigerian banks
- 95%+ transaction parsing accuracy
- Duplicate detection prevents data corruption
- Balance validation ensures data integrity
- Import history provides audit trail

---

## Sprint Objectives

### Primary Objectives

The Transaction Management System must enable users to seamlessly import bank statements from Nigeria's major financial institutions, automatically normalize transaction data across varying bank formats, detect and prevent duplicate entries, validate account balances, and maintain comprehensive import audit trails. This foundational capability is essential for the platform's core value proposition of automated tax compliance.

### Secondary Objectives

Beyond core functionality, the system establishes scalable architecture patterns for future bank integrations, implements robust error handling for malformed data, creates user-friendly import workflows with clear feedback, and builds monitoring infrastructure for import success rates and performance metrics.

### Out of Scope

PDF bank statement parsing with OCR (deferred to Sprint 8), real-time bank API integration via Mono/Okra (Phase 3), international bank formats (Phase 4), and automated transaction categorization (already completed in Sprint 11-12).

---

## Project Scope

### In Scope

**CSV Parser Engine**
- Support for 10 major Nigerian banks (GTBank, Zenith, Access, First Bank, UBA, Ecobank, Stanbic IBTC, Fidelity, Union Bank, Wema)
- Automatic format detection and column mapping
- Date format normalization (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Currency parsing (₦, NGN, Naira symbols)
- Debit/Credit detection and amount normalization

**Excel Parser Engine**
- .xlsx (Office Open XML) support
- .xls (Excel 97-2003) support
- Multi-sheet detection and selection
- Header row auto-detection
- Formula evaluation for calculated cells

**Transaction Normalization**
- Bank-specific parser adapters (10 banks)
- Merchant name standardization
- Transaction type classification (debit, credit, transfer, fee)
- Reference number extraction
- Balance tracking and validation

**Duplicate Detection**
- Multi-factor matching algorithm (date, amount, merchant, reference)
- Fuzzy matching for merchant names (85% similarity threshold)
- User confirmation workflow for potential duplicates
- Automatic merge for exact matches

**Balance Validation**
- Opening balance verification
- Running balance calculation
- Closing balance reconciliation
- Discrepancy alerts and resolution

**Import History & Audit Trail**
- Import session tracking (file name, date, user, status)
- Transaction count and amount summaries
- Error logs with line numbers
- Rollback capability for failed imports

**User Interface**
- Drag-and-drop file upload
- Bank selection dropdown
- Import progress indicator
- Error display with actionable messages
- Import history dashboard

### Out of Scope (Deferred)

- PDF parsing with OCR (Sprint 8)
- Bank API integration (Phase 3 - Sprint 15-16)
- International bank formats (Phase 4)
- Automated categorization (already in Sprint 11-12)
- Multi-currency support (Phase 2)

---

## Technical Architecture

### System Components

**Frontend (Next.js + React)**
- Upload UI component with drag-and-drop
- Bank selector with logo display
- Progress tracker with real-time updates
- Error display with retry capability
- Import history table with filters

**Backend (Next.js API Routes)**
- `/api/transactions/upload` - File upload endpoint
- `/api/transactions/parse` - Parser orchestration
- `/api/transactions/validate` - Duplicate detection
- `/api/transactions/import-history` - Audit trail retrieval

**Parser Service (Node.js)**
- CSV parser (using `papaparse` library)
- Excel parser (using `xlsx` library)
- Bank adapter factory pattern
- Transaction normalizer
- Validation engine

**Database (PostgreSQL via Supabase)**
- `transactions` table (existing)
- `import_sessions` table (new)
- `import_errors` table (new)
- `duplicate_candidates` table (new)

### Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| CSV Parsing | papaparse 5.4.1 | Industry standard, handles malformed data |
| Excel Parsing | xlsx 0.18.5 | Supports .xlsx and .xls, formula evaluation |
| File Upload | Next.js API + Formidable | Multipart form handling, 10MB limit |
| Duplicate Detection | Levenshtein distance | Fuzzy string matching for merchant names |
| Validation | Zod 3.22.4 | Type-safe schema validation |
| UI Components | shadcn/ui + Tailwind | Consistent with existing design system |

### Database Schema

```sql
-- Import Sessions Table
CREATE TABLE import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  bank_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transactions_imported INTEGER DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import Errors Table
CREATE TABLE import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES import_sessions(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Duplicate Candidates Table
CREATE TABLE duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES import_sessions(id) ON DELETE CASCADE,
  existing_transaction_id UUID NOT NULL REFERENCES transactions(id),
  new_transaction_data JSONB NOT NULL,
  similarity_score DECIMAL(5,2) NOT NULL,
  match_factors TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'merged', 'kept_both', 'rejected')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_import_sessions_user_id ON import_sessions(user_id);
CREATE INDEX idx_import_sessions_status ON import_sessions(status);
CREATE INDEX idx_import_errors_session_id ON import_errors(session_id);
CREATE INDEX idx_duplicate_candidates_session_id ON duplicate_candidates(session_id);
CREATE INDEX idx_duplicate_candidates_status ON duplicate_candidates(status);
```

---

## Detailed Task Breakdown

### Phase 1: Foundation & Setup (Days 1-2)

**Task 1.1: Database Schema Implementation**
- **Duration:** 4 hours
- **Assignee:** Backend Developer
- **Description:** Create `import_sessions`, `import_errors`, and `duplicate_candidates` tables with proper indexes, foreign keys, and RLS policies
- **Deliverables:** Migration scripts, RLS policies, database documentation
- **Dependencies:** None
- **Acceptance Criteria:**
  - All tables created with correct schema
  - RLS policies enforce user-level data isolation
  - Indexes improve query performance (< 50ms)

**Task 1.2: Install Parser Libraries**
- **Duration:** 1 hour
- **Assignee:** Backend Developer
- **Description:** Install and configure `papaparse`, `xlsx`, and `formidable` libraries with TypeScript definitions
- **Deliverables:** Updated package.json, type definitions
- **Dependencies:** None
- **Acceptance Criteria:**
  - Libraries installed without conflicts
  - TypeScript compilation successful
  - No security vulnerabilities (npm audit)

**Task 1.3: Bank Configuration Data**
- **Duration:** 3 hours
- **Assignee:** Backend Developer + Product Manager
- **Description:** Research and document CSV/Excel formats for 10 Nigerian banks, create bank configuration JSON with column mappings
- **Deliverables:** `bank-configs.json` with format specifications
- **Dependencies:** None
- **Acceptance Criteria:**
  - 10 banks documented (GTBank, Zenith, Access, First Bank, UBA, Ecobank, Stanbic IBTC, Fidelity, Union Bank, Wema)
  - Sample files collected for testing
  - Column mappings verified

---

### Phase 2: CSV/Excel Parsing Engine (Days 3-4)

**Task 2.1: CSV Parser Core**
- **Duration:** 6 hours
- **Assignee:** Backend Developer
- **Description:** Implement CSV parser using papaparse with error handling, encoding detection (UTF-8, Windows-1252), and delimiter auto-detection
- **Deliverables:** `csv-parser.ts` module
- **Dependencies:** Task 1.2
- **Acceptance Criteria:**
  - Parses CSV files up to 10MB
  - Handles malformed rows gracefully
  - Detects headers automatically
  - Supports multiple encodings

**Task 2.2: Excel Parser Core**
- **Duration:** 6 hours
- **Assignee:** Backend Developer
- **Description:** Implement Excel parser using xlsx library with multi-sheet support, formula evaluation, and date parsing
- **Deliverables:** `excel-parser.ts` module
- **Dependencies:** Task 1.2
- **Acceptance Criteria:**
  - Parses .xlsx and .xls files
  - Handles multi-sheet workbooks
  - Evaluates formulas correctly
  - Converts Excel dates to ISO format

**Task 2.3: Bank Adapter Factory**
- **Duration:** 8 hours
- **Assignee:** Backend Developer
- **Description:** Implement adapter pattern for bank-specific parsers, create base adapter class, implement 10 bank-specific adapters
- **Deliverables:** `bank-adapters/` directory with 10 adapter classes
- **Dependencies:** Task 1.3, Task 2.1, Task 2.2
- **Acceptance Criteria:**
  - Base adapter defines common interface
  - Each bank adapter maps columns correctly
  - Handles bank-specific quirks (e.g., GTBank's merged cells)
  - Unit tests for each adapter (95%+ coverage)

---

### Phase 3: Transaction Normalization (Days 5-6)

**Task 3.1: Transaction Normalizer**
- **Duration:** 6 hours
- **Assignee:** Backend Developer
- **Description:** Implement transaction normalization logic for date formats, currency parsing, merchant name standardization, and amount normalization
- **Deliverables:** `transaction-normalizer.ts` module
- **Dependencies:** Task 2.3
- **Acceptance Criteria:**
  - Converts all date formats to ISO 8601
  - Parses currency symbols (₦, NGN, Naira)
  - Standardizes merchant names (trim, uppercase, remove special chars)
  - Handles negative amounts for debits

**Task 3.2: Balance Validator**
- **Duration:** 4 hours
- **Assignee:** Backend Developer
- **Description:** Implement balance validation logic with opening balance verification, running balance calculation, and closing balance reconciliation
- **Deliverables:** `balance-validator.ts` module
- **Dependencies:** Task 3.1
- **Acceptance Criteria:**
  - Calculates running balance for each transaction
  - Detects discrepancies (tolerance: ₦0.01)
  - Generates reconciliation report
  - Alerts user to balance mismatches

**Task 3.3: Duplicate Detection Algorithm**
- **Duration:** 8 hours
- **Assignee:** Backend Developer
- **Description:** Implement multi-factor duplicate detection using date, amount, merchant, and reference number matching with Levenshtein distance for fuzzy matching
- **Deliverables:** `duplicate-detector.ts` module
- **Dependencies:** Task 3.1
- **Acceptance Criteria:**
  - Exact match: 100% similarity (date + amount + merchant)
  - Fuzzy match: 85%+ similarity (merchant name)
  - Considers ±1 day date tolerance
  - Ranks candidates by similarity score

---

### Phase 4: API Endpoints (Days 7-8)

**Task 4.1: File Upload Endpoint**
- **Duration:** 4 hours
- **Assignee:** Backend Developer
- **Description:** Implement `/api/transactions/upload` endpoint with multipart form handling, file size validation (10MB limit), and virus scanning
- **Deliverables:** `src/app/api/transactions/upload/route.ts`
- **Dependencies:** Task 1.2
- **Acceptance Criteria:**
  - Accepts CSV and Excel files
  - Validates file size (< 10MB)
  - Returns upload session ID
  - Stores file temporarily (24-hour TTL)

**Task 4.2: Parse Endpoint**
- **Duration:** 6 hours
- **Assignee:** Backend Developer
- **Description:** Implement `/api/transactions/parse` endpoint that orchestrates bank adapter selection, parsing, normalization, and validation
- **Deliverables:** `src/app/api/transactions/parse/route.ts`
- **Dependencies:** Task 2.3, Task 3.1, Task 3.2
- **Acceptance Criteria:**
  - Selects correct bank adapter
  - Parses transactions with progress updates
  - Validates balance
  - Returns parsed transactions and errors

**Task 4.3: Duplicate Validation Endpoint**
- **Duration:** 4 hours
- **Assignee:** Backend Developer
- **Description:** Implement `/api/transactions/validate` endpoint for duplicate detection and user confirmation workflow
- **Deliverables:** `src/app/api/transactions/validate/route.ts`
- **Dependencies:** Task 3.3
- **Acceptance Criteria:**
  - Detects duplicates in < 2 seconds
  - Returns ranked candidates
  - Supports bulk merge/reject
  - Updates duplicate_candidates table

**Task 4.4: Import History Endpoint**
- **Duration:** 3 hours
- **Assignee:** Backend Developer
- **Description:** Implement `/api/transactions/import-history` endpoint for retrieving import sessions with pagination and filtering
- **Deliverables:** `src/app/api/transactions/import-history/route.ts`
- **Dependencies:** Task 1.1
- **Acceptance Criteria:**
  - Returns paginated import history
  - Filters by date range, status, bank
  - Includes error counts and summaries
  - Supports CSV export

---

### Phase 5: User Interface (Days 9-10)

**Task 5.1: Upload UI Component**
- **Duration:** 6 hours
- **Assignee:** Frontend Developer
- **Description:** Create drag-and-drop file upload component with bank selector, file validation, and progress indicator
- **Deliverables:** `src/components/transactions/upload-form.tsx`
- **Dependencies:** Task 4.1
- **Acceptance Criteria:**
  - Drag-and-drop file upload
  - Bank logo display in selector
  - Real-time progress bar
  - Error messages with retry button

**Task 5.2: Duplicate Resolution UI**
- **Duration:** 5 hours
- **Assignee:** Frontend Developer
- **Description:** Create duplicate resolution interface with side-by-side comparison, similarity score display, and bulk actions
- **Deliverables:** `src/components/transactions/duplicate-resolver.tsx`
- **Dependencies:** Task 4.3
- **Acceptance Criteria:**
  - Side-by-side transaction comparison
  - Similarity score visualization
  - Bulk merge/reject actions
  - Undo capability

**Task 5.3: Import History Dashboard**
- **Duration:** 5 hours
- **Assignee:** Frontend Developer
- **Description:** Create import history page with session list, error logs, and export capability
- **Deliverables:** `src/app/(dashboard)/transactions/import-history/page.tsx`
- **Dependencies:** Task 4.4
- **Acceptance Criteria:**
  - Paginated session list
  - Expandable error logs
  - Date range filter
  - CSV export button

**Task 5.4: Integration & Polish**
- **Duration:** 4 hours
- **Assignee:** Frontend Developer
- **Description:** Integrate upload flow into existing transaction page, add loading states, error boundaries, and success notifications
- **Deliverables:** Updated transaction page
- **Dependencies:** Task 5.1, Task 5.2, Task 5.3
- **Acceptance Criteria:**
  - Seamless integration with existing UI
  - Consistent design system usage
  - Mobile-responsive layout
  - Accessibility compliance (WCAG 2.1 AA)

---

### Phase 6: Testing & Quality Assurance (Days 10-11)

**Task 6.1: Unit Testing**
- **Duration:** 6 hours
- **Assignee:** Backend Developer + Frontend Developer
- **Description:** Write unit tests for parsers, normalizers, validators, and UI components with 90%+ code coverage
- **Deliverables:** Test files in `__tests__/` directories
- **Dependencies:** All implementation tasks
- **Acceptance Criteria:**
  - 90%+ code coverage
  - All edge cases tested
  - Mock data for 10 banks
  - CI/CD integration

**Task 6.2: Integration Testing**
- **Duration:** 4 hours
- **Assignee:** QA Engineer
- **Description:** Test end-to-end upload workflows with real bank statement samples from 10 banks
- **Deliverables:** Test report with pass/fail status
- **Dependencies:** Task 6.1
- **Acceptance Criteria:**
  - 10 banks tested successfully
  - Duplicate detection verified
  - Balance validation confirmed
  - Error handling validated

**Task 6.3: Performance Testing**
- **Duration:** 3 hours
- **Assignee:** Backend Developer
- **Description:** Load test upload endpoint with files up to 10MB and 10,000 transactions
- **Deliverables:** Performance test report
- **Dependencies:** Task 6.2
- **Acceptance Criteria:**
  - Parses 10,000 transactions in < 30 seconds
  - API response time < 500ms (p95)
  - Memory usage < 512MB
  - No memory leaks

**Task 6.4: User Acceptance Testing**
- **Duration:** 5 hours
- **Assignee:** Product Manager + Beta Users
- **Description:** Conduct UAT with 5 beta users uploading real bank statements
- **Deliverables:** UAT feedback report
- **Dependencies:** Task 6.3
- **Acceptance Criteria:**
  - 5 users complete upload successfully
  - 95%+ parsing accuracy
  - No critical bugs
  - User satisfaction > 4/5

---

## Resource Allocation

### Team Structure

**Core Team (3 FTE)**

| Role | Name | Allocation | Responsibilities |
|------|------|------------|------------------|
| Backend Developer | TBD | 100% (80 hours) | Parser engine, API endpoints, database |
| Frontend Developer | TBD | 100% (80 hours) | Upload UI, duplicate resolution, import history |
| QA Engineer | TBD | 50% (40 hours) | Testing, quality assurance, UAT coordination |

**Supporting Team (Part-Time)**

| Role | Name | Allocation | Responsibilities |
|------|------|------------|------------------|
| Product Manager | Kezie | 25% (20 hours) | Requirements, UAT, stakeholder communication |
| DevOps Engineer | TBD | 10% (8 hours) | CI/CD, deployment, monitoring setup |
| UX Designer | TBD | 10% (8 hours) | UI review, accessibility audit |

**Total Effort:** 236 hours (29.5 person-days)

---

## Timeline & Milestones

### Sprint Schedule (10 Working Days)

| Day | Phase | Key Deliverables | Milestone |
|-----|-------|------------------|-----------|
| 1-2 | Foundation | Database schema, libraries, bank configs | ✓ Setup Complete |
| 3-4 | Parsing Engine | CSV parser, Excel parser, bank adapters | ✓ Parsers Ready |
| 5-6 | Normalization | Transaction normalizer, balance validator, duplicate detector | ✓ Validation Ready |
| 7-8 | API Endpoints | Upload, parse, validate, import history APIs | ✓ Backend Complete |
| 9-10 | User Interface | Upload UI, duplicate resolution, import history | ✓ Frontend Complete |
| 10-11 | Testing & QA | Unit tests, integration tests, UAT | ✓ Sprint Complete |

### Critical Path

```
Database Schema (Day 1) 
  → CSV/Excel Parsers (Day 3-4) 
    → Bank Adapters (Day 4) 
      → Normalizer & Validator (Day 5-6) 
        → API Endpoints (Day 7-8) 
          → UI Components (Day 9-10) 
            → Testing (Day 10-11)
```

**Critical Path Duration:** 11 days (includes 1 day buffer)

### Key Milestones

| Milestone | Date | Success Criteria |
|-----------|------|------------------|
| **M1: Setup Complete** | Feb 11, 2026 | Database schema deployed, libraries installed, bank configs documented |
| **M2: Parsers Ready** | Feb 13, 2026 | CSV/Excel parsers functional, 10 bank adapters implemented |
| **M3: Validation Ready** | Feb 15, 2026 | Transaction normalization, balance validation, duplicate detection working |
| **M4: Backend Complete** | Feb 17, 2026 | All API endpoints deployed and tested |
| **M5: Frontend Complete** | Feb 19, 2026 | Upload UI, duplicate resolution, import history functional |
| **M6: Sprint Complete** | Feb 21, 2026 | All tests passed, UAT successful, production-ready |

---

## Risk Management

### High-Risk Items

**Risk 1: Bank Format Variations**
- **Probability:** HIGH (80%)
- **Impact:** MEDIUM (delays parsing accuracy)
- **Mitigation:** 
  - Collect 3+ sample files per bank for testing
  - Implement flexible column mapping with fuzzy matching
  - Add manual column mapping UI as fallback
  - Budget 20% contingency time for format edge cases
- **Contingency:** If formats vary significantly, prioritize 5 major banks (GTBank, Zenith, Access, First Bank, UBA) and defer others to Sprint 8

**Risk 2: Duplicate Detection False Positives**
- **Probability:** MEDIUM (50%)
- **Impact:** MEDIUM (user frustration, data integrity issues)
- **Mitigation:**
  - Use multi-factor matching (date + amount + merchant + reference)
  - Implement adjustable similarity threshold (default 85%)
  - Require user confirmation for all duplicates
  - Add "Keep Both" option for uncertain matches
- **Contingency:** If false positive rate > 20%, disable automatic merging and require manual review for all duplicates

**Risk 3: Performance Degradation with Large Files**
- **Probability:** MEDIUM (40%)
- **Impact:** HIGH (poor user experience, timeouts)
- **Mitigation:**
  - Implement streaming parser for files > 5MB
  - Add progress updates every 1000 rows
  - Use background job processing for files > 10,000 transactions
  - Implement pagination for duplicate resolution
- **Contingency:** If performance < 30 seconds for 10,000 transactions, reduce file size limit to 5MB and recommend splitting large files

**Risk 4: Resource Availability**
- **Probability:** MEDIUM (30%)
- **Impact:** HIGH (sprint delay)
- **Mitigation:**
  - Confirm team availability before sprint start
  - Cross-train developers on parser and UI tasks
  - Prepare detailed technical specifications for quick onboarding
  - Identify backup developers for critical roles
- **Contingency:** If key developer unavailable, extend sprint by 3 days or reduce scope to 5 banks

### Medium-Risk Items

**Risk 5: Excel Formula Evaluation Errors**
- **Probability:** MEDIUM (40%)
- **Impact:** LOW (affects calculated cells only)
- **Mitigation:** Test with sample files containing formulas, fall back to raw values if evaluation fails
- **Contingency:** Display warning to users about formula limitations, recommend CSV export from Excel

**Risk 6: Balance Validation Discrepancies**
- **Probability:** MEDIUM (50%)
- **Impact:** MEDIUM (user confusion, trust issues)
- **Mitigation:** Implement tolerance (₦0.01), provide detailed reconciliation report, allow users to override
- **Contingency:** Make balance validation optional with warning if disabled

**Risk 7: Encoding Issues (Non-UTF-8 Files)**
- **Probability:** LOW (20%)
- **Impact:** MEDIUM (parsing failures)
- **Mitigation:** Auto-detect encoding (UTF-8, Windows-1252, ISO-8859-1), provide encoding selector in UI
- **Contingency:** Recommend users save files as UTF-8 before upload

---

## Budget Estimation

### Labor Costs

| Role | Rate (₦/hour) | Hours | Cost (₦) |
|------|---------------|-------|----------|
| Backend Developer | 15,000 | 80 | 1,200,000 |
| Frontend Developer | 15,000 | 80 | 1,200,000 |
| QA Engineer | 10,000 | 40 | 400,000 |
| Product Manager | 20,000 | 20 | 400,000 |
| DevOps Engineer | 18,000 | 8 | 144,000 |
| UX Designer | 12,000 | 8 | 96,000 |
| **Total Labor** | | **236** | **3,440,000** |

### Infrastructure Costs

| Item | Cost (₦) | Notes |
|------|----------|-------|
| Supabase Storage (10GB) | 5,000 | Temporary file storage |
| Vercel Pro Plan | 20,000 | Increased bandwidth for file uploads |
| Testing Infrastructure | 10,000 | Load testing tools |
| **Total Infrastructure** | **35,000** | |

### Software Licenses

| Item | Cost (₦) | Notes |
|------|----------|-------|
| npm Libraries | 0 | All open-source |
| Development Tools | 0 | Existing licenses |
| **Total Software** | **0** | |

### Contingency

| Item | Cost (₦) | Notes |
|------|----------|-------|
| Contingency (15%) | 521,250 | For scope changes, delays |
| **Total Contingency** | **521,250** | |

### Total Sprint 5 Budget

| Category | Cost (₦) | Percentage |
|----------|----------|------------|
| Labor | 3,440,000 | 86% |
| Infrastructure | 35,000 | 1% |
| Software | 0 | 0% |
| Contingency | 521,250 | 13% |
| **TOTAL** | **3,996,250** | **100%** |

**Budget Status:** Within Phase 1 allocation (₦10M total, ₦4M for Sprint 5)

---

## Success Metrics

### Functional Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Parsing Accuracy | 95%+ | Manual validation of 100 transactions per bank |
| Duplicate Detection Precision | 90%+ | False positive rate < 10% |
| Duplicate Detection Recall | 95%+ | False negative rate < 5% |
| Balance Validation Accuracy | 99%+ | Discrepancy rate < 1% |
| Supported Banks | 10 | GTBank, Zenith, Access, First Bank, UBA, Ecobank, Stanbic IBTC, Fidelity, Union Bank, Wema |

### Performance Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Upload Time (1MB file) | < 5 seconds | Performance testing |
| Parse Time (1,000 transactions) | < 10 seconds | Performance testing |
| Parse Time (10,000 transactions) | < 30 seconds | Performance testing |
| API Response Time (p95) | < 500ms | Application monitoring |
| Memory Usage | < 512MB | Load testing |

### User Experience Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Upload Success Rate | 95%+ | Analytics tracking |
| User Satisfaction | 4/5+ | UAT survey |
| Error Rate | < 5% | Error tracking |
| Support Tickets | < 10 | Support system |

### Business Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Beta User Onboarding | 100 users | User registration |
| Transactions Imported | 50,000+ | Database query |
| Feature Adoption | 80%+ | Usage analytics |
| Time to First Import | < 5 minutes | User flow tracking |

---

## Dependencies & Prerequisites

### External Dependencies

**Bank Statement Samples**
- Collect 3+ sample CSV/Excel files from each of 10 banks
- Obtain permission to use real (anonymized) data for testing
- Document format variations and edge cases

**User Access**
- Recruit 5 beta users for UAT
- Schedule UAT sessions (Feb 20-21)
- Prepare UAT scripts and feedback forms

**Infrastructure**
- Increase Supabase storage quota to 10GB
- Upgrade Vercel plan for increased bandwidth
- Configure file upload size limits (10MB)

### Internal Dependencies

**Existing Features**
- Transaction table schema (already exists)
- User authentication (Supabase Auth)
- Transaction list UI (existing page)
- Category management (for auto-categorization after import)

**Upcoming Features**
- Financial statement generation (Sprint 6) - will use imported transactions
- NRS filing (Sprint 7) - requires transaction data
- E-invoicing (Sprint 9-10) - may integrate with transaction import

---

## Quality Assurance Plan

### Testing Strategy

**Unit Testing (90%+ Coverage)**
- Parser functions (CSV, Excel, bank adapters)
- Normalizer functions (date, currency, merchant)
- Validator functions (balance, duplicates)
- API route handlers
- UI components (upload form, duplicate resolver)

**Integration Testing**
- End-to-end upload workflow (10 banks)
- Duplicate detection with real data
- Balance validation with reconciliation
- Error handling and recovery

**Performance Testing**
- Load test with 10MB files
- Stress test with 10,000 transactions
- Concurrent user simulation (50 users)
- Memory leak detection

**User Acceptance Testing**
- 5 beta users upload real bank statements
- Feedback survey (satisfaction, ease of use, bugs)
- Bug prioritization and fixes

### Acceptance Criteria

**Sprint 5 is complete when:**

1. Users can upload CSV and Excel files from 10 Nigerian banks
2. Parsing accuracy is 95%+ for all supported banks
3. Duplicate detection prevents data corruption with 90%+ precision
4. Balance validation ensures data integrity with 99%+ accuracy
5. Import history provides complete audit trail
6. All unit tests pass with 90%+ code coverage
7. Integration tests pass for all 10 banks
8. Performance tests meet targets (< 30 seconds for 10,000 transactions)
9. UAT feedback is positive (4/5+ satisfaction)
10. No critical bugs remain

---

## Communication Plan

### Daily Standups

**Time:** 9:00 AM WAT  
**Duration:** 15 minutes  
**Attendees:** Core team (Backend Dev, Frontend Dev, QA Engineer)  
**Format:**
- What did you complete yesterday?
- What will you work on today?
- Any blockers or dependencies?

### Weekly Status Reports

**Frequency:** Every Friday at 5:00 PM WAT  
**Audience:** Product Manager, Stakeholders  
**Content:**
- Progress vs. plan (% complete)
- Milestones achieved
- Risks and issues
- Next week's priorities

### Sprint Review

**Date:** February 21, 2026 at 3:00 PM WAT  
**Duration:** 1 hour  
**Attendees:** Full team + stakeholders  
**Agenda:**
- Demo of completed features
- UAT results presentation
- Metrics review (accuracy, performance, satisfaction)
- Lessons learned
- Sprint 6 planning preview

### Escalation Path

**Level 1:** Team Lead (Backend/Frontend Dev)  
**Level 2:** Product Manager (Kezie)  
**Level 3:** CTO / Executive Team

**Escalation Triggers:**
- Critical bug blocking progress
- Resource unavailability
- Scope change request
- Budget overrun risk
- Timeline delay > 2 days

---

## Post-Sprint Activities

### Sprint Retrospective

**Date:** February 22, 2026 at 10:00 AM WAT  
**Duration:** 1 hour  
**Attendees:** Core team  
**Agenda:**
- What went well?
- What could be improved?
- Action items for Sprint 6

### Documentation

- Update technical documentation with parser specifications
- Create user guide for transaction upload
- Document bank format variations and edge cases
- Update API documentation with new endpoints

### Knowledge Transfer

- Conduct code walkthrough for parser engine
- Train support team on common upload issues
- Create troubleshooting guide for users
- Document lessons learned for future sprints

### Monitoring Setup

- Configure alerts for upload failures (> 5%)
- Set up dashboard for import metrics
- Enable error tracking for parser issues
- Monitor performance metrics (response time, memory)

---

## Appendix A: Bank Configuration Specifications

### Supported Banks

| Bank | Code | CSV Format | Excel Format | Notes |
|------|------|------------|--------------|-------|
| GTBank | GTB | ✓ | ✓ | Uses merged cells for headers |
| Zenith Bank | ZEN | ✓ | ✓ | Includes running balance |
| Access Bank | ACC | ✓ | ✓ | Multiple date formats |
| First Bank | FBN | ✓ | ✓ | Separate debit/credit columns |
| UBA | UBA | ✓ | ✓ | Includes transaction fees |
| Ecobank | ECO | ✓ | ✓ | Multi-currency support |
| Stanbic IBTC | SBT | ✓ | ✓ | PDF-like formatting in Excel |
| Fidelity Bank | FID | ✓ | ✓ | Includes reference numbers |
| Union Bank | UNB | ✓ | ✓ | Older Excel format (.xls) |
| Wema Bank | WEM | ✓ | ✓ | Minimal columns |

### Column Mapping Examples

**GTBank CSV Format:**
```
Date,Transaction Details,Value Date,Debit,Credit,Balance
01/02/2026,TRANSFER TO JOHN DOE,01/02/2026,50000.00,,450000.00
02/02/2026,POS PURCHASE - SHOPRITE,02/02/2026,25000.00,,425000.00
```

**Zenith Bank CSV Format:**
```
Tran Date,Value Date,Narration,Debit,Credit,Balance,Ref
2026-02-01,2026-02-01,TRF TO JANE SMITH,50000,0,450000,ZEN20260201001
2026-02-02,2026-02-02,POS-SHOPRITE LAGOS,25000,0,425000,ZEN20260202001
```

---

## Appendix B: Duplicate Detection Algorithm

### Matching Factors

| Factor | Weight | Threshold | Description |
|--------|--------|-----------|-------------|
| Date Match | 30% | ±1 day | Exact or adjacent dates |
| Amount Match | 40% | Exact | Identical transaction amounts |
| Merchant Match | 25% | 85% similarity | Levenshtein distance on merchant names |
| Reference Match | 5% | Exact | Bank reference numbers (if available) |

### Similarity Score Calculation

```typescript
function calculateSimilarity(
  existing: Transaction,
  new: Transaction
): number {
  let score = 0;
  
  // Date match (30%)
  const daysDiff = Math.abs(
    (new.date.getTime() - existing.date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff === 0) score += 0.30;
  else if (daysDiff === 1) score += 0.20;
  
  // Amount match (40%)
  if (new.amount === existing.amount) score += 0.40;
  
  // Merchant match (25%)
  const merchantSimilarity = levenshteinSimilarity(
    new.merchant.toLowerCase(),
    existing.merchant.toLowerCase()
  );
  score += 0.25 * merchantSimilarity;
  
  // Reference match (5%)
  if (new.reference && existing.reference && 
      new.reference === existing.reference) {
    score += 0.05;
  }
  
  return score;
}
```

### Decision Rules

| Similarity Score | Action | User Confirmation |
|------------------|--------|-------------------|
| 100% | Auto-merge | No (log only) |
| 85-99% | Flag as duplicate | Yes (recommended merge) |
| 70-84% | Flag as potential | Yes (manual review) |
| < 70% | Keep both | No |

---

## Appendix C: Error Handling Specification

### Error Categories

**Parsing Errors**
- Invalid file format (not CSV/Excel)
- Corrupted file (cannot read)
- Missing required columns
- Invalid data types (e.g., text in amount column)
- Encoding issues (non-UTF-8)

**Validation Errors**
- Balance mismatch (opening/closing)
- Duplicate transactions detected
- Invalid date format
- Negative balance (overdraft without flag)
- Missing mandatory fields

**System Errors**
- File size exceeds limit (> 10MB)
- Upload timeout (> 60 seconds)
- Database connection failure
- Out of memory
- API rate limit exceeded

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "PARSING_ERROR",
    "message": "Invalid date format in row 15",
    "details": {
      "row": 15,
      "column": "date",
      "value": "32/13/2026",
      "expected": "DD/MM/YYYY or YYYY-MM-DD"
    },
    "recoverable": true,
    "suggestions": [
      "Check date format in your bank statement",
      "Try exporting as CSV with UTF-8 encoding",
      "Contact support if issue persists"
    ]
  }
}
```

### User-Facing Error Messages

| Error Code | User Message | Action |
|------------|--------------|--------|
| INVALID_FILE_FORMAT | "This file format is not supported. Please upload a CSV or Excel file." | Show supported formats |
| FILE_TOO_LARGE | "File size exceeds 10MB limit. Please split into smaller files." | Suggest file splitting |
| MISSING_COLUMNS | "Required columns not found. Please select your bank from the dropdown." | Show bank selector |
| BALANCE_MISMATCH | "Opening/closing balance doesn't match. Review discrepancies below." | Show reconciliation report |
| DUPLICATE_DETECTED | "5 duplicate transactions found. Review and merge or keep both." | Show duplicate resolver |

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Author:** Manus AI (Product Planning System)  
**Approved By:** Kezie (Product Manager)
