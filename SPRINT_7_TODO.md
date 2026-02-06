# KOMPLEET Phase 2 - Sprint 7 TODO

## Sprint 7: NRS Form Generation & Filing Deadline Management
**Duration:** 2 weeks  
**Priority:** P1  
**Goal:** Enable NRS-compatible filing workflows with automated deadline reminders

---

## Feature 1: NRS Form Generation

### Database Schema
- [x] Create `nrs_forms` table
- [x] Create `filing_status` table
- [x] Create `filing_deadlines` table
- [x] Create `deadline_reminders` table
- [x] Create `filing_audit_logs` table

### PDF Generation Service
- [x] Create NRS PIT (Personal Income Tax) form template
- [x] Create NRS CIT (Company Income Tax) form template
- [x] Create NRS VAT form template
- [x] Build form pre-fill logic from Supabase user data
- [x] Add form validation before PDF generation

### Filing Center Page
- [x] Create `/filing` page with form type selector
- [x] Add form generation UI with tax year selector
- [x] Display generated forms list with download buttons
- [x] Add filing status tracking interface
- [x] Create filing workflow guide/instructions

### API Endpoints
- [x] POST `/api/forms/generate` - Generate NRS form PDF
- [x] GET `/api/forms/list` - List user's generated forms
- [x] GET `/api/forms/[id]/download` - Download form PDF
- [x] POST `/api/forms/[id]/mark-filed` - Update filing status

---

## Feature 2: Filing Deadline Management

### Deadline Calculation Service
- [x] Build deadline calculation logic for PIT, CIT, VAT
- [x] Create reminder scheduling service (7 days, 3 days, 1 day before)
- [x] Add deadline status tracking (upcoming, due soon, overdue)

### Email Notification System
- [x] Set up email service integration
- [x] Create email template for 7-day reminder
- [x] Create email template for 3-day reminder
- [x] Create email template for 1-day reminder
- [x] Build background job for sending reminders

### Notification Center
- [x] Create `/notifications` page
- [x] Display upcoming deadlines with countdown
- [x] Show reminder history
- [x] Add notification preferences
- [x] Create in-app notification badge

### Filing History
- [x] Create filing history page component
- [x] Display past filings with status
- [x] Add filter by year and form type

---

## Testing & Validation

- [x] Test PIT form generation
- [x] Test CIT form generation
- [x] Test VAT form generation
- [x] Verify form accuracy against NRS templates
- [x] Test deadline calculation
- [x] Test email reminder delivery
- [x] End-to-end filing workflow test
