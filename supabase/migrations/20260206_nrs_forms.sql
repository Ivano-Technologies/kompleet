-- NRS Forms and Filing Management Schema
-- Sprint 7: Phase 2 Enhancement

-- Create nrs_forms table
CREATE TABLE IF NOT EXISTS public.nrs_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    form_type TEXT NOT NULL CHECK (form_type IN ('PIT', 'CIT', 'VAT')),
    tax_year INTEGER NOT NULL,
    form_data JSONB NOT NULL,
    pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'filed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create filing_status table
CREATE TABLE IF NOT EXISTS public.filing_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    form_id UUID REFERENCES public.nrs_forms(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'filed', 'rejected', 'accepted')),
    filed_date TIMESTAMP WITH TIME ZONE,
    confirmation_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create filing_deadlines table
CREATE TABLE IF NOT EXISTS public.filing_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type TEXT NOT NULL CHECK (form_type IN ('PIT', 'CIT', 'VAT_Q1', 'VAT_Q2', 'VAT_Q3', 'VAT_Q4')),
    tax_year INTEGER NOT NULL,
    deadline_date DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deadline_reminders table
CREATE TABLE IF NOT EXISTS public.deadline_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deadline_id UUID NOT NULL REFERENCES public.filing_deadlines(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create filing_audit_logs table
CREATE TABLE IF NOT EXISTS public.filing_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    form_id UUID REFERENCES public.nrs_forms(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nrs_forms_user_id ON public.nrs_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_nrs_forms_tax_year ON public.nrs_forms(tax_year);
CREATE INDEX IF NOT EXISTS idx_filing_status_user_id ON public.filing_status(user_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_user_id ON public.deadline_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_sent ON public.deadline_reminders(sent);
CREATE INDEX IF NOT EXISTS idx_filing_audit_logs_user_id ON public.filing_audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.nrs_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filing_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filing_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nrs_forms
CREATE POLICY "Users can view their own forms" ON public.nrs_forms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own forms" ON public.nrs_forms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own forms" ON public.nrs_forms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own forms" ON public.nrs_forms FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for filing_status
CREATE POLICY "Users can view their own filing status" ON public.filing_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own filing status" ON public.filing_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own filing status" ON public.filing_status FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for filing_deadlines
CREATE POLICY "Authenticated users can view deadlines" ON public.filing_deadlines FOR SELECT TO authenticated USING (true);

-- RLS Policies for deadline_reminders
CREATE POLICY "Users can view their own reminders" ON public.deadline_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reminders" ON public.deadline_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.deadline_reminders FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for filing_audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.filing_audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert audit logs" ON public.filing_audit_logs FOR INSERT WITH CHECK (true);

-- Populate 2026 filing deadlines
INSERT INTO public.filing_deadlines (form_type, tax_year, deadline_date, description) VALUES
    ('PIT', 2026, '2027-03-31', 'Personal Income Tax (PIT) Return - 2026 Tax Year'),
    ('CIT', 2026, '2027-06-30', 'Company Income Tax (CIT) Return - 2026 Tax Year'),
    ('VAT_Q1', 2026, '2026-04-21', 'VAT Return - Q1 2026 (January - March)'),
    ('VAT_Q2', 2026, '2026-07-21', 'VAT Return - Q2 2026 (April - June)'),
    ('VAT_Q3', 2026, '2026-10-21', 'VAT Return - Q3 2026 (July - September)'),
    ('VAT_Q4', 2026, '2027-01-21', 'VAT Return - Q4 2026 (October - December)')
ON CONFLICT DO NOTHING;

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nrs_forms_updated_at BEFORE UPDATE ON public.nrs_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_filing_status_updated_at BEFORE UPDATE ON public.filing_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
