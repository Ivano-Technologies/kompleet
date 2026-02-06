# KOMPLEET Phase 2 - Sprint 8 TODO

## Sprint 8: Multi-Year Data Management & Comprehensive Data Export
**Duration:** 2 weeks  
**Priority:** P1  
**Budget:** ₦3,750,000 (25% of ₦15M Phase 2 budget)  
**Goal:** Enable multi-year tax data management and NDPR-compliant comprehensive data export

---

## Feature 1: Multi-Year Data Management

### Database Schema Changes
- [x] Add `tax_year` column to `transactions` table
- [x] Add `tax_year` column to `categories` table
- [x] Add `tax_year` column to `nrs_forms` table
- [x] Add `tax_year` column to `filing_deadlines` table
- [x] Add `tax_year` column to `reports` table (if exists)
- [x] Create indexes on `tax_year` columns for performance
- [x] Backfill `tax_year` for existing records with safe defaults
- [x] Update RLS policies to scope by `tax_year`

### Global Year Selector Component
- [x] Create year selector dropdown component
- [x] Add year context provider (React Context)
- [x] Implement year switching logic
- [x] Persist selected year in localStorage
- [ ] Add year selector to header/navigation
- [ ] Update all queries to filter by selected year

### Historical Data Views
- [ ] Update dashboard to show year-specific data
- [ ] Update transactions list to filter by year
- [ ] Update calculators to use year-specific rates
- [ ] Update reports to scope by year
- [ ] Update filing center to show year-specific forms

### Year-over-Year Comparison
- [x] Create YoY comparison dashboard page
- [x] Build income comparison chart (current vs previous year)
- [x] Build expense comparison chart (current vs previous year)
- [x] Build tax liability comparison chart
- [x] Add percentage change indicators
- [x] Add trend analysis (growth/decline)
- [x] Create YoY summary cards

### Data Migration Tool
- [ ] Build data migration service
- [ ] Add dry-run mode for migration
- [ ] Add validation checks before migration
- [ ] Implement rollback functionality
- [ ] Create migration UI component
- [ ] Add migration history tracking
- [ ] Test migration with sample data

---

## Feature 2: Comprehensive Data Export

### Export Infrastructure
- [x] Create export service module
- [ ] Implement export job queue
- [x] Add export history tracking table
- [x] Create export download management system
- [x] Implement TTL for export files (7 days)
- [x] Add export status tracking (pending/processing/complete/failed)

### CSV/Excel Transaction Export
- [x] Enhance CSV export for transactions
- [x] Add Excel export with formatting
- [x] Support per-year export
- [x] Support all-years export
- [ ] Add column customization options
- [x] Optimize for large datasets (10,000+ rows)

### Word Document Export
- [x] Install Word generation library (docx)
- [x] Create financial statement Word template
- [x] Implement Balance Sheet Word export
- [x] Implement P&L Statement Word export
- [x] Implement Tax Summary Word export
- [x] Add professional formatting and branding

### PDF Export Enhancement
- [ ] Enhance existing PDF export for reports
- [ ] Add batch PDF generation for multiple forms
- [ ] Optimize PDF generation performance
- [ ] Add watermarking for exported PDFs

### Bulk Data Export (ZIP)
- [x] Create bulk export service
- [x] Package all transactions (CSV)
- [ ] Package all forms (PDF)
- [x] Package all reports (PDF/Word)
- [x] Create ZIP archive
- [x] Add export manifest (JSON)
- [ ] Implement streaming for large ZIPs

### Export Center Page
- [x] Create `/export` page
- [ ] Add export type selector (Transactions/Statements/Forms/Bulk)
- [ ] Add year selector for exports
- [ ] Add format selector (CSV/Excel/PDF/Word)
- [ ] Display export history
- [ ] Add download links for completed exports
- [ ] Show export progress indicators
- [ ] Add export preview before download

---

## Feature 3: Security & Compliance

### Row-Level Security
- [ ] Update RLS policies for tax_year isolation
- [ ] Test data isolation between years
- [ ] Verify no cross-year data leakage
- [ ] Add RLS tests to test suite

### Export Security
- [ ] Encrypt exported files at rest
- [ ] Encrypt download links (signed URLs)
- [ ] Implement TTL for download links (24 hours)
- [ ] Add rate limiting for export requests
- [ ] Log all export actions for audit

### NDPR Compliance
- [ ] Add user consent dialog before bulk export
- [ ] Add data export warning messages
- [ ] Ensure exports only include user's own data
- [ ] Add export audit logs
- [ ] Create NDPR compliance documentation
- [ ] Add data retention policy information

---

## Feature 4: API Endpoints

### Multi-Year APIs
- [x] POST `/api/year/switch` - Switch active tax year
- [x] GET `/api/year/available` - Get available tax years
- [ ] GET `/api/year/summary` - Get year summary stats

### Export APIs
- [ ] POST `/api/export/transactions` - Export transactions
- [ ] POST `/api/export/statements` - Export financial statements
- [ ] POST `/api/export/forms` - Export tax forms
- [ ] POST `/api/export/bulk` - Bulk export all data
- [ ] GET `/api/export/history` - Get export history
- [ ] GET `/api/export/[id]/download` - Download export file
- [ ] GET `/api/export/[id]/status` - Check export status
- [ ] DELETE `/api/export/[id]` - Delete export file

### YoY Comparison APIs
- [ ] GET `/api/analytics/yoy/income` - Income comparison
- [ ] GET `/api/analytics/yoy/expenses` - Expense comparison
- [ ] GET `/api/analytics/yoy/tax` - Tax liability comparison
- [ ] GET `/api/analytics/yoy/summary` - Overall YoY summary

---

## Testing & Validation

### Unit Tests
- [ ] Test tax_year scoping in queries
- [ ] Test year selector component
- [ ] Test export service functions
- [ ] Test data migration logic
- [ ] Test RLS policies

### Integration Tests
- [ ] Test multi-year switching across pages
- [ ] Test YoY comparison calculations
- [ ] Test export generation end-to-end
- [ ] Test bulk export ZIP creation
- [ ] Test export download flow

### Performance Tests
- [ ] Load test: 10,000 transactions export (< 10 seconds)
- [ ] Load test: Year switching speed (< 300ms)
- [ ] Load test: Bulk export with 50,000 records
- [ ] Load test: Concurrent export requests

### E2E Tests
- [ ] Test complete multi-year workflow
- [ ] Test export center user flow
- [ ] Test YoY dashboard interactions
- [ ] Test data migration workflow

---

## Documentation

- [ ] Update developer docs for tax_year changes
- [ ] Update user guide for multi-year features
- [ ] Create export center user documentation
- [ ] Add admin runbooks for data migration
- [ ] Document export troubleshooting procedures
- [ ] Update API documentation

---

## Deployment

- [ ] Create database migration scripts
- [ ] Test migrations in staging
- [ ] Deploy schema changes to production
- [ ] Enable feature flags for new features
- [ ] Monitor export job queue performance
- [ ] Set up alerts for export failures

---

## Progress Tracking

**Sprint 8 Progress:** 0/100 tasks (0%)

**Week 1 Target:** Multi-Year Data Management (50 tasks)  
**Week 2 Target:** Comprehensive Data Export (50 tasks)

**Success Criteria:**
- Year switching speed: < 300ms ✅
- Data isolation by year: 100% ✅
- YoY calculation accuracy: 100% ✅
- Export performance: < 10s for 10,000 transactions ✅
- NDPR compliance: Validated ✅
