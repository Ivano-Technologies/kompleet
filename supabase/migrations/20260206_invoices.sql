-- KOMPLEET Sprint 9-10: NRS-Compliant E-Invoicing Module
-- Database Schema for Invoices

-- ============================================
-- 1. Invoice Sequences Table (Auto-numbering)
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  prefix VARCHAR(20) NOT NULL DEFAULT 'INV',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tax_year)
);

CREATE INDEX idx_invoice_sequences_user_year ON invoice_sequences(user_id, tax_year);

-- ============================================
-- 2. Invoices Table
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  
  -- Invoice Identification
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Customer Information (JSONB for flexibility)
  customer_info JSONB NOT NULL,
  -- Expected structure:
  -- {
  --   "name": "Customer Name",
  --   "email": "customer@example.com",
  --   "phone": "+234...",
  --   "address": "Full address",
  --   "tin": "Tax Identification Number"
  -- }
  
  -- Line Items (JSONB array)
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Expected structure:
  -- [
  --   {
  --     "description": "Product/Service",
  --     "quantity": 10,
  --     "unit_price": 5000,
  --     "vat_rate": 7.5,
  --     "discount": 0,
  --     "amount": 50000
  --   }
  -- ]
  
  -- Financial Calculations
  subtotal DECIMAL(15, 2) NOT NULL,
  vat_amount DECIMAL(15, 2) NOT NULL,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  
  -- Payment & Terms
  payment_terms TEXT,
  notes TEXT,
  
  -- Digital Signature & QR Code
  signature_hash TEXT, -- SHA-256 hash of invoice data signed with private key
  qr_payload TEXT, -- QR code data (NRS-compliant format)
  
  -- Status & Workflow
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- Possible values: draft, issued, paid, cancelled, archived
  
  -- Timestamps
  issued_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- PDF Storage
  pdf_url TEXT,
  pdf_size INTEGER,
  
  -- Template
  template_id UUID,
  
  -- Immutability flag
  is_immutable BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('draft', 'issued', 'paid', 'cancelled', 'archived')),
  CONSTRAINT positive_amounts CHECK (
    subtotal >= 0 AND 
    vat_amount >= 0 AND 
    total_amount >= 0
  ),
  CONSTRAINT invoice_issued_check CHECK (
    (status = 'draft' AND issued_at IS NULL) OR
    (status != 'draft' AND issued_at IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_tax_year ON invoices(tax_year);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer_name ON invoices((customer_info->>'name'));
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_user_year_status ON invoices(user_id, tax_year, status);

-- ============================================
-- 3. Invoice Templates Table
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#0A6847', -- Nigerian green
  secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
  font_family VARCHAR(50) DEFAULT 'Arial',
  
  -- Layout Settings (JSONB)
  layout_settings JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "header_height": 100,
  --   "footer_text": "Thank you for your business",
  --   "show_qr_code": true,
  --   "show_signature": true
  -- }
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '[]'::jsonb,
  
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_templates_user_id ON invoice_templates(user_id);

-- ============================================
-- 4. Invoice Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  -- Actions: created, issued, updated, cancelled, downloaded, archived, signature_verified, qr_scanned
  
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_audit_logs_invoice_id ON invoice_audit_logs(invoice_id);
CREATE INDEX idx_invoice_audit_logs_action ON invoice_audit_logs(action);
CREATE INDEX idx_invoice_audit_logs_created_at ON invoice_audit_logs(created_at);

-- ============================================
-- 5. Invoice Archive Storage Table
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Archive Details
  archive_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retention_until DATE NOT NULL, -- Must be >= 7 years from invoice date
  
  -- Storage
  archive_url TEXT NOT NULL, -- Long-term storage URL
  archive_hash TEXT NOT NULL, -- SHA-256 hash for tamper detection
  file_size INTEGER,
  
  -- Access Tracking
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  -- Possible values: active, expired, deleted
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT retention_period_check CHECK (
    retention_until >= (SELECT invoice_date + INTERVAL '7 years' FROM invoices WHERE id = invoice_id)
  )
);

CREATE INDEX idx_invoice_archives_invoice_id ON invoice_archives(invoice_id);
CREATE INDEX idx_invoice_archives_retention_until ON invoice_archives(retention_until);
CREATE INDEX idx_invoice_archives_status ON invoice_archives(status);

-- ============================================
-- 6. Row-Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_archives ENABLE ROW LEVEL SECURITY;

-- Invoice Sequences Policies
CREATE POLICY invoice_sequences_user_policy ON invoice_sequences
  FOR ALL USING (auth.uid() = user_id);

-- Invoices Policies
CREATE POLICY invoices_user_select_policy ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY invoices_user_insert_policy ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY invoices_user_update_policy ON invoices
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    (is_immutable = FALSE OR status = 'draft')
  );

CREATE POLICY invoices_user_delete_policy ON invoices
  FOR DELETE USING (
    auth.uid() = user_id AND 
    status = 'draft'
  );

-- Invoice Templates Policies
CREATE POLICY invoice_templates_user_policy ON invoice_templates
  FOR ALL USING (auth.uid() = user_id);

-- Invoice Audit Logs Policies (read-only for users)
CREATE POLICY invoice_audit_logs_user_select_policy ON invoice_audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Invoice Archives Policies
CREATE POLICY invoice_archives_user_select_policy ON invoice_archives
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 7. Functions & Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_invoice_sequences_updated_at
  BEFORE UPDATE ON invoice_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_templates_updated_at
  BEFORE UPDATE ON invoice_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent modification of issued invoices
CREATE OR REPLACE FUNCTION prevent_invoice_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_immutable = TRUE AND NEW.status != 'cancelled' THEN
    RAISE EXCEPTION 'Cannot modify an issued invoice';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_invoice_modification_trigger
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION prevent_invoice_modification();

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(
  p_user_id UUID,
  p_tax_year INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
  v_sequence_id UUID;
  v_next_number INTEGER;
  v_prefix VARCHAR(20);
  v_invoice_number VARCHAR(50);
BEGIN
  -- Get or create sequence for user and tax year
  INSERT INTO invoice_sequences (user_id, tax_year, last_number, prefix)
  VALUES (p_user_id, p_tax_year, 0, 'INV')
  ON CONFLICT (user_id, tax_year) DO NOTHING;
  
  -- Increment and get next number (with row locking to prevent duplicates)
  UPDATE invoice_sequences
  SET last_number = last_number + 1
  WHERE user_id = p_user_id AND tax_year = p_tax_year
  RETURNING id, last_number, prefix INTO v_sequence_id, v_next_number, v_prefix;
  
  -- Format invoice number: INV-2026-0001
  v_invoice_number := v_prefix || '-' || p_tax_year || '-' || LPAD(v_next_number::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Initial Data
-- ============================================

-- Insert default invoice template (will be created per user on first use)
-- This is just a placeholder for the default template structure

COMMENT ON TABLE invoices IS 'NRS-compliant e-invoices with digital signatures and QR codes';
COMMENT ON TABLE invoice_sequences IS 'Sequential invoice numbering per user and tax year';
COMMENT ON TABLE invoice_templates IS 'Customizable invoice templates with branding';
COMMENT ON TABLE invoice_audit_logs IS 'Comprehensive audit trail for invoice operations';
COMMENT ON TABLE invoice_archives IS '7-year tamper-evident invoice archiving for compliance';
