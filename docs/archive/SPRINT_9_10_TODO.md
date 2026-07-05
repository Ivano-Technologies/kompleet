# KOMPLEET Sprint 9-10 - NRS-Compliant E-Invoicing Module

**Priority:** P0 (MANDATORY 2026 COMPLIANCE)  
**Duration:** 4 weeks  
**Timeline:** Feb 20 - Mar 20, 2026  
**Budget:** ₦7,500,000

---

## Success Criteria

- ✅ NRS E-Invoicing Compliance: 100%
- ✅ Invoice Generation Time: < 2 seconds
- ✅ Archiving Retention: >= 7 years
- ✅ No Duplicate Invoice Numbers
- ✅ Signatures Verifiable and Tamper-Proof

---

## Phase 1: Database Schema & Data Model

### Invoices Table

- [x] Create `invoices` table with all required fields
- [x] Add `invoice_number` (unique, sequential per user)
- [x] Add `tax_year` column
- [x] Add `customer_info` JSONB field
- [x] Add `line_items` JSONB array field
- [x] Add `subtotal`, `vat_amount`, `total_amount` columns
- [x] Add `signature_hash` for digital signature
- [x] Add `qr_payload` for QR code data
- [x] Add `status` (draft/issued/cancelled/archived)
- [x] Add `issued_at`, `archived_at` timestamps
- [x] Add `pdf_url` for stored invoice PDF
- [x] Create indexes on `invoice_number`, `user_id`, `tax_year`, `status`

### Invoice Line Items Schema

- [x] Define line item structure (description, quantity, unit_price, vat_rate, amount)
- [x] Support multiple VAT rates (0%, 7.5%)
- [x] Add discount support

### Invoice Numbering

- [x] Create `invoice_sequences` table for auto-numbering
- [x] Implement globally unique sequential numbering per user
- [x] Add year-based prefix (e.g., INV-2026-0001)
- [x] Ensure no gaps or duplicates

### RLS Policies

- [x] Add RLS policies scoped by `user_id`
- [x] Restrict invoice modification after issuance
- [x] Log all invoice access

---

## Phase 2: Invoice Generation Service

### Core Invoice Service

- [ ] Create invoice generation service module
- [ ] Implement VAT calculation logic (7.5%)
- [ ] Implement subtotal and total calculation
- [ ] Add rounding rules (Nigerian Naira, 2 decimals)
- [ ] Validate invoice data before generation

### PDF Generation

- [ ] Install PDF generation library (jsPDF or PDFKit)
- [ ] Create professional invoice PDF template
- [ ] Add company branding (logo, colors)
- [ ] Add invoice header (number, date, due date)
- [ ] Add customer details section
- [ ] Add line items table with VAT breakdown
- [ ] Add totals section (subtotal, VAT, total)
- [ ] Add payment terms and notes
- [ ] Add footer with digital signature and QR code
- [ ] Optimize PDF generation for < 2s

### Invoice Templates

- [ ] Create default invoice template
- [ ] Add template customization support
- [ ] Support custom branding (logo, colors, fonts)
- [ ] Support custom fields
- [ ] Store templates in database

---

## Phase 3: QR Code & Digital Signatures

### QR Code Integration

- [x] Install QR code library (qrcode.react or qrcode)
- [x] Define QR code payload structure (NRS-compliant)
- [x] Include invoice number, amount, VAT, date, signature in QR
- [x] Generate QR code image
- [x] Embed QR code in PDF invoice
- [x] Add QR code verification endpoint

### Digital Signature

- [x] Implement digital signature using Web Crypto API
- [x] Generate RSA key pair for user/organization
- [x] Securely store private keys (encrypted)
- [x] Sign invoice data (hash of invoice fields)
- [x] Store signature hash in database
- [x] Implement signature verification endpoint
- [x] Ensure signatures are non-repudiable
- [x] Make invoices immutable after signing

---

## Phase 4: Invoice UI Pages

### Invoice Creation Page (`/invoices/new`)

- [ ] Create invoice form with customer details
- [ ] Add line items input (dynamic rows)
- [ ] Auto-calculate VAT and totals
- [ ] Add template selector
- [ ] Add save as draft functionality
- [ ] Add issue invoice button
- [ ] Show real-time preview
- [ ] Add form validation

### Invoice List Page (`/invoices`)

- [ ] Display all invoices in table/grid
- [ ] Add filters (status, date range, customer)
- [ ] Add search by invoice number
- [ ] Add pagination
- [ ] Show invoice status badges
- [ ] Add quick actions (view, download, cancel)
- [ ] Add bulk actions (export, archive)

### Invoice Detail Page (`/invoices/[id]`)

- [ ] Display full invoice details
- [ ] Show PDF preview
- [ ] Add download PDF button
- [ ] Show QR code
- [ ] Show digital signature status
- [ ] Add cancel invoice button (if not archived)
- [ ] Show audit trail

---

## Phase 5: Archiving & Compliance

### 7-Year Archiving

- [ ] Implement automatic archiving after 30 days
- [ ] Store archived invoices in long-term storage
- [ ] Implement tamper-evident storage
- [ ] Add retention policy (>= 7 years)
- [ ] Create background job for archiving
- [ ] Add archive access logging

### Compliance Features

- [ ] Validate invoice format against NRS specifications
- [ ] Ensure QR code payload meets NRS requirements
- [ ] Maintain compliance evidence logs
- [ ] Version invoice schema for regulatory changes
- [ ] Create compliance report generator

### Audit Logging

- [ ] Log invoice creation
- [ ] Log invoice issuance
- [ ] Log invoice cancellation
- [ ] Log PDF downloads
- [ ] Log archive access
- [ ] Log signature verification attempts

---

## Phase 6: API Endpoints

### Invoice APIs

- [ ] POST `/api/invoices/create` - Create draft invoice
- [ ] POST `/api/invoices/[id]/issue` - Issue invoice (immutable)
- [ ] GET `/api/invoices` - List invoices
- [ ] GET `/api/invoices/[id]` - Get invoice details
- [ ] GET `/api/invoices/[id]/pdf` - Download invoice PDF
- [ ] POST `/api/invoices/[id]/cancel` - Cancel invoice
- [ ] GET `/api/invoices/[id]/verify` - Verify signature and QR

### Numbering API

- [ ] GET `/api/invoices/next-number` - Get next invoice number

### Template APIs

- [ ] GET `/api/invoices/templates` - List templates
- [ ] POST `/api/invoices/templates` - Create custom template

---

## Phase 7: Testing & Validation

### Unit Tests

- [ ] Test VAT calculation logic
- [ ] Test invoice numbering (no duplicates)
- [ ] Test subtotal/total calculations
- [ ] Test rounding rules
- [ ] Test signature generation and verification

### Integration Tests

- [ ] Test QR code generation and payload
- [ ] Test PDF generation
- [ ] Test invoice issuance workflow
- [ ] Test archiving workflow
- [ ] Test RLS policies

### Performance Tests

- [ ] Load test invoice generation (< 2s under load)
- [ ] Test concurrent invoice creation
- [ ] Test PDF generation performance
- [ ] Test database query performance

### Compliance Tests

- [ ] Validate against NRS e-invoicing requirements
- [ ] Test QR code compliance
- [ ] Test signature compliance
- [ ] Test archiving retention
- [ ] Generate compliance report

### End-to-End Tests

- [ ] Test full invoice creation flow
- [ ] Test invoice issuance and immutability
- [ ] Test PDF download
- [ ] Test archive retrieval after 7 years

---

## Phase 8: Security & Deployment

### Security

- [ ] Encrypt private keys for signatures
- [ ] Implement key rotation policy
- [ ] Secure PDF storage (encrypted at rest)
- [ ] Add rate limiting on invoice APIs
- [ ] Implement CSRF protection
- [ ] Add input sanitization

### Feature Flag

- [ ] Deploy behind feature flag
- [ ] Enable for beta users first
- [ ] Monitor performance and errors
- [ ] Gradual rollout to all users

### Monitoring

- [ ] Add invoice generation metrics
- [ ] Add PDF generation time tracking
- [ ] Add signature verification metrics
- [ ] Add error rate monitoring
- [ ] Set up alerts for failures

### Documentation

- [ ] Developer API documentation
- [ ] User guide for invoice creation
- [ ] Compliance documentation for NRS audits
- [ ] Incident response runbook

---

## Definition of Done

- [ ] Invoice creation and listing pages live
- [ ] QR code and digital signature live
- [ ] VAT calculation verified at 7.5%
- [ ] Auto-numbering stable and unique
- [ ] 7-year archiving policy enforced
- [ ] NRS compliance validation completed
- [ ] Monitoring and audit logs live
- [ ] All documentation updated
- [ ] Performance SLA met (< 2s generation)
- [ ] Zero P1 bugs in production

---

**Total Tasks:** 120  
**Estimated Effort:** 4 weeks  
**Priority:** P0 (MANDATORY)
