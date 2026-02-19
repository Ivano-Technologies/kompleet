create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

create extension if not exists "wrappers" with schema "extensions";

drop extension if exists "pg_net";

drop index if exists "public"."idx_transactions_type";


  create table "public"."file_uploads" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "file_name" text not null,
    "file_size" integer not null,
    "file_type" text not null,
    "storage_path" text not null,
    "status" text default 'pending'::text,
    "error_message" text,
    "transactions_found" integer default 0,
    "transactions_imported" integer default 0,
    "duplicates_skipped" integer default 0,
    "detected_bank" text,
    "created_at" timestamp with time zone not null default now(),
    "processed_at" timestamp with time zone
      );


alter table "public"."file_uploads" enable row level security;


  create table "public"."financial_statements" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "statement_type" text not null,
    "period_start" date not null,
    "period_end" date not null,
    "data" jsonb not null,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."financial_statements" enable row level security;


  create table "public"."invoices" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "invoice_number" text not null,
    "invoice_date" date not null,
    "due_date" date,
    "customer_name" text not null,
    "customer_tin" text,
    "customer_address" text,
    "customer_email" text,
    "subtotal" numeric(15,2) not null,
    "vat_rate" numeric(5,4) default 0.075,
    "vat_amount" numeric(15,2) generated always as ((subtotal * vat_rate)) stored,
    "total_amount" numeric(15,2) generated always as ((subtotal * ((1)::numeric + vat_rate))) stored,
    "line_items" jsonb not null default '[]'::jsonb,
    "qr_code_data" text,
    "digital_signature" text,
    "nrs_submission_id" text,
    "status" text default 'draft'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."invoices" enable row level security;


  create table "public"."review_actions" (
    "id" uuid not null default gen_random_uuid(),
    "review_queue_id" uuid not null,
    "action_type" text not null,
    "action_by" uuid not null,
    "action_details" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."review_actions" enable row level security;


  create table "public"."review_queue" (
    "id" uuid not null default gen_random_uuid(),
    "source_id" uuid not null,
    "change_type" text not null,
    "change_summary" text not null,
    "change_details" jsonb not null,
    "proposed_rule_changes" jsonb,
    "status" text not null default 'pending'::text,
    "priority" text not null default 'medium'::text,
    "assigned_to" uuid,
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "review_notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."review_queue" enable row level security;


  create table "public"."rule_versions" (
    "id" uuid not null default gen_random_uuid(),
    "version_number" text not null,
    "description" text,
    "effective_from" timestamp with time zone not null,
    "effective_to" timestamp with time zone,
    "is_active" boolean not null default false,
    "approved_by" uuid,
    "approved_at" timestamp with time zone,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."rule_versions" enable row level security;


  create table "public"."sources" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "type" text not null,
    "url" text not null,
    "description" text,
    "check_frequency_days" integer not null default 30,
    "last_checked_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."sources" enable row level security;


  create table "public"."tax_filings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "tax_year" integer not null,
    "filing_period" public.filing_period not null default 'annual'::public.filing_period,
    "tax_type" public.tax_type not null,
    "gross_income" numeric(15,2) default 0,
    "total_deductions" numeric(15,2) default 0,
    "taxable_income" numeric(15,2) default 0,
    "tax_due" numeric(15,2) default 0,
    "tax_paid" numeric(15,2) default 0,
    "tax_balance" numeric(15,2) generated always as ((tax_due - tax_paid)) stored,
    "reliefs_applied" jsonb default '{}'::jsonb,
    "calculation_breakdown" jsonb default '{}'::jsonb,
    "status" public.filing_status not null default 'draft'::public.filing_status,
    "submitted_at" timestamp with time zone,
    "nrs_reference" text,
    "generated_documents" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tax_filings" enable row level security;


  create table "public"."tax_reports" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "report_type" text not null,
    "tax_year" integer not null,
    "period_start" date not null,
    "period_end" date not null,
    "business_classification" text not null,
    "qualifies_as_small_company" boolean default false,
    "total_revenue" numeric(15,2) not null default 0,
    "total_expenses" numeric(15,2) not null default 0,
    "assessable_profit" numeric(15,2) not null default 0,
    "taxable_income" numeric(15,2) not null default 0,
    "income_tax" numeric(15,2) not null default 0,
    "development_levy" numeric(15,2) not null default 0,
    "total_tax_liability" numeric(15,2) not null default 0,
    "effective_tax_rate" numeric(5,2) not null default 0,
    "computation_data" jsonb not null,
    "generated_at" timestamp with time zone default now(),
    "status" text not null default 'draft'::text,
    "filed_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "payment_reference" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."tax_reports" enable row level security;


  create table "public"."tax_rules" (
    "id" uuid not null default gen_random_uuid(),
    "rule_version_id" uuid not null,
    "source_id" uuid not null,
    "rule_type" text not null,
    "rule_key" text not null,
    "rule_value" jsonb not null,
    "confidence_level" text not null,
    "last_reviewed_at" timestamp with time zone not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tax_rules" enable row level security;

alter table "public"."categories" alter column "tax_treatment" set data type text using "tax_treatment"::text;

alter table "public"."transactions" drop column "tax_year";

alter table "public"."transactions" alter column "transaction_type" set data type text using "transaction_type"::text;

CREATE UNIQUE INDEX file_uploads_pkey ON public.file_uploads USING btree (id);

CREATE UNIQUE INDEX financial_statements_pkey ON public.financial_statements USING btree (id);

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_logs_rule_version_id ON public.audit_logs USING btree (rule_version_id);

CREATE INDEX idx_audit_logs_type ON public.audit_logs USING btree (calculation_type);

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_audit_logs_version ON public.audit_logs USING btree (rule_version_id);

CREATE INDEX idx_categories_tax_treatment ON public.categories USING btree (tax_treatment);

CREATE INDEX idx_categories_type ON public.categories USING btree (category_type);

CREATE INDEX idx_clerk_users_clerk_user_id ON public.clerk_users USING btree (clerk_user_id);

CREATE INDEX idx_clerk_users_email ON public.clerk_users USING btree (email);

CREATE INDEX idx_financial_statements_created ON public.financial_statements USING btree (created_at DESC);

CREATE INDEX idx_financial_statements_period ON public.financial_statements USING btree (period_start, period_end);

CREATE INDEX idx_financial_statements_type ON public.financial_statements USING btree (statement_type);

CREATE INDEX idx_financial_statements_user_id ON public.financial_statements USING btree (user_id);

CREATE INDEX idx_profiles_clerk_user_id ON public.profiles USING btree (clerk_user_id);

CREATE INDEX idx_review_actions_by ON public.review_actions USING btree (action_by);

CREATE INDEX idx_review_actions_queue ON public.review_actions USING btree (review_queue_id);

CREATE INDEX idx_review_queue_assigned ON public.review_queue USING btree (assigned_to);

CREATE INDEX idx_review_queue_assigned_to ON public.review_queue USING btree (assigned_to);

CREATE INDEX idx_review_queue_priority ON public.review_queue USING btree (priority);

CREATE INDEX idx_review_queue_source_id ON public.review_queue USING btree (source_id);

CREATE INDEX idx_review_queue_status ON public.review_queue USING btree (status);

CREATE INDEX idx_rule_versions_active ON public.rule_versions USING btree (is_active);

CREATE INDEX idx_rule_versions_effective ON public.rule_versions USING btree (effective_from, effective_to);

CREATE INDEX idx_rule_versions_effective_from ON public.rule_versions USING btree (effective_from);

CREATE INDEX idx_rule_versions_is_active ON public.rule_versions USING btree (is_active);

CREATE INDEX idx_sources_last_checked ON public.sources USING btree (last_checked_at);

CREATE INDEX idx_sources_type ON public.sources USING btree (type);

CREATE INDEX idx_tax_reports_status ON public.tax_reports USING btree (status);

CREATE INDEX idx_tax_reports_tax_year ON public.tax_reports USING btree (tax_year);

CREATE INDEX idx_tax_reports_type ON public.tax_reports USING btree (report_type);

CREATE INDEX idx_tax_reports_user_id ON public.tax_reports USING btree (user_id);

CREATE INDEX idx_tax_rules_key ON public.tax_rules USING btree (rule_key);

CREATE INDEX idx_tax_rules_rule_type ON public.tax_rules USING btree (rule_type);

CREATE INDEX idx_tax_rules_rule_version_id ON public.tax_rules USING btree (rule_version_id);

CREATE INDEX idx_tax_rules_source_id ON public.tax_rules USING btree (source_id);

CREATE INDEX idx_tax_rules_type ON public.tax_rules USING btree (rule_type);

CREATE INDEX idx_tax_rules_version ON public.tax_rules USING btree (rule_version_id);

CREATE INDEX idx_transactions_category_id ON public.transactions USING btree (category_id);

CREATE INDEX idx_transactions_clerk_user_id ON public.transactions USING btree (clerk_user_id);

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at DESC);

CREATE INDEX idx_transactions_date ON public.transactions USING btree (transaction_date DESC);

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX invoices_user_id_invoice_number_key ON public.invoices USING btree (user_id, invoice_number);

CREATE UNIQUE INDEX review_actions_pkey ON public.review_actions USING btree (id);

CREATE UNIQUE INDEX review_queue_pkey ON public.review_queue USING btree (id);

CREATE UNIQUE INDEX rule_versions_pkey ON public.rule_versions USING btree (id);

CREATE UNIQUE INDEX rule_versions_version_number_key ON public.rule_versions USING btree (version_number);

CREATE UNIQUE INDEX sources_pkey ON public.sources USING btree (id);

CREATE UNIQUE INDEX tax_filings_pkey ON public.tax_filings USING btree (id);

CREATE UNIQUE INDEX tax_filings_user_id_tax_year_filing_period_tax_type_key ON public.tax_filings USING btree (user_id, tax_year, filing_period, tax_type);

CREATE UNIQUE INDEX tax_reports_pkey ON public.tax_reports USING btree (id);

CREATE UNIQUE INDEX tax_rules_pkey ON public.tax_rules USING btree (id);

CREATE UNIQUE INDEX tax_rules_rule_version_id_rule_key_key ON public.tax_rules USING btree (rule_version_id, rule_key);

CREATE INDEX idx_transactions_type ON public.transactions USING btree (transaction_type);

alter table "public"."file_uploads" add constraint "file_uploads_pkey" PRIMARY KEY using index "file_uploads_pkey";

alter table "public"."financial_statements" add constraint "financial_statements_pkey" PRIMARY KEY using index "financial_statements_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."review_actions" add constraint "review_actions_pkey" PRIMARY KEY using index "review_actions_pkey";

alter table "public"."review_queue" add constraint "review_queue_pkey" PRIMARY KEY using index "review_queue_pkey";

alter table "public"."rule_versions" add constraint "rule_versions_pkey" PRIMARY KEY using index "rule_versions_pkey";

alter table "public"."sources" add constraint "sources_pkey" PRIMARY KEY using index "sources_pkey";

alter table "public"."tax_filings" add constraint "tax_filings_pkey" PRIMARY KEY using index "tax_filings_pkey";

alter table "public"."tax_reports" add constraint "tax_reports_pkey" PRIMARY KEY using index "tax_reports_pkey";

alter table "public"."tax_rules" add constraint "tax_rules_pkey" PRIMARY KEY using index "tax_rules_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_rule_version_id_fkey" FOREIGN KEY (rule_version_id) REFERENCES public.rule_versions(id) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_rule_version_id_fkey";

alter table "public"."categories" add constraint "categories_tax_treatment_check" CHECK ((tax_treatment = ANY (ARRAY['deductible'::text, 'non_deductible'::text, 'capital_allowance'::text, 'exempt'::text]))) not valid;

alter table "public"."categories" validate constraint "categories_tax_treatment_check";

alter table "public"."file_uploads" add constraint "file_uploads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."file_uploads" validate constraint "file_uploads_user_id_fkey";

alter table "public"."financial_statements" add constraint "financial_statements_statement_type_check" CHECK ((statement_type = ANY (ARRAY['profit_loss'::text, 'balance_sheet'::text]))) not valid;

alter table "public"."financial_statements" validate constraint "financial_statements_statement_type_check";

alter table "public"."financial_statements" add constraint "financial_statements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."financial_statements" validate constraint "financial_statements_user_id_fkey";

alter table "public"."invoices" add constraint "invoices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_user_id_fkey";

alter table "public"."invoices" add constraint "invoices_user_id_invoice_number_key" UNIQUE using index "invoices_user_id_invoice_number_key";

alter table "public"."review_actions" add constraint "review_actions_action_type_check" CHECK ((action_type = ANY (ARRAY['assigned'::text, 'commented'::text, 'approved'::text, 'rejected'::text, 'requested_changes'::text]))) not valid;

alter table "public"."review_actions" validate constraint "review_actions_action_type_check";

alter table "public"."review_actions" add constraint "review_actions_review_queue_id_fkey" FOREIGN KEY (review_queue_id) REFERENCES public.review_queue(id) ON DELETE CASCADE not valid;

alter table "public"."review_actions" validate constraint "review_actions_review_queue_id_fkey";

alter table "public"."review_queue" add constraint "review_queue_change_type_check" CHECK ((change_type = ANY (ARRAY['new_rule'::text, 'rule_update'::text, 'rule_deprecation'::text]))) not valid;

alter table "public"."review_queue" validate constraint "review_queue_change_type_check";

alter table "public"."review_queue" add constraint "review_queue_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."review_queue" validate constraint "review_queue_priority_check";

alter table "public"."review_queue" add constraint "review_queue_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.sources(id) not valid;

alter table "public"."review_queue" validate constraint "review_queue_source_id_fkey";

alter table "public"."review_queue" add constraint "review_queue_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_review'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."review_queue" validate constraint "review_queue_status_check";

alter table "public"."rule_versions" add constraint "rule_versions_version_number_key" UNIQUE using index "rule_versions_version_number_key";

alter table "public"."sources" add constraint "sources_type_check" CHECK ((type = ANY (ARRAY['primary'::text, 'secondary'::text]))) not valid;

alter table "public"."sources" validate constraint "sources_type_check";

alter table "public"."tax_filings" add constraint "tax_filings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."tax_filings" validate constraint "tax_filings_user_id_fkey";

alter table "public"."tax_filings" add constraint "tax_filings_user_id_tax_year_filing_period_tax_type_key" UNIQUE using index "tax_filings_user_id_tax_year_filing_period_tax_type_key";

alter table "public"."tax_reports" add constraint "tax_reports_report_type_check" CHECK ((report_type = ANY (ARRAY['income_tax'::text, 'development_levy'::text, 'vat'::text, 'comprehensive'::text]))) not valid;

alter table "public"."tax_reports" validate constraint "tax_reports_report_type_check";

alter table "public"."tax_reports" add constraint "tax_reports_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'filed'::text, 'paid'::text, 'archived'::text]))) not valid;

alter table "public"."tax_reports" validate constraint "tax_reports_status_check";

alter table "public"."tax_reports" add constraint "tax_reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tax_reports" validate constraint "tax_reports_user_id_fkey";

alter table "public"."tax_rules" add constraint "tax_rules_confidence_level_check" CHECK ((confidence_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]))) not valid;

alter table "public"."tax_rules" validate constraint "tax_rules_confidence_level_check";

alter table "public"."tax_rules" add constraint "tax_rules_rule_type_check" CHECK ((rule_type = ANY (ARRAY['individual_income_tax'::text, 'business_tax'::text, 'vat'::text, 'stamp_duty'::text, 'capital_allowance'::text, 'development_levy'::text, 'property_tax'::text]))) not valid;

alter table "public"."tax_rules" validate constraint "tax_rules_rule_type_check";

alter table "public"."tax_rules" add constraint "tax_rules_rule_version_id_fkey" FOREIGN KEY (rule_version_id) REFERENCES public.rule_versions(id) ON DELETE CASCADE not valid;

alter table "public"."tax_rules" validate constraint "tax_rules_rule_version_id_fkey";

alter table "public"."tax_rules" add constraint "tax_rules_rule_version_id_rule_key_key" UNIQUE using index "tax_rules_rule_version_id_rule_key_key";

alter table "public"."tax_rules" add constraint "tax_rules_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.sources(id) not valid;

alter table "public"."tax_rules" validate constraint "tax_rules_source_id_fkey";

alter table "public"."transactions" add constraint "transactions_transaction_type_check" CHECK ((transaction_type = ANY (ARRAY['debit'::text, 'credit'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_transaction_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.activate_rule_version(version_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Deactivate all other versions
    UPDATE rule_versions SET is_active = FALSE;
    
    -- Activate the specified version
    UPDATE rule_versions
    SET is_active = TRUE, updated_at = NOW()
    WHERE id = version_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_cit_2026(gross_revenue numeric, allowable_expenses numeric DEFAULT 0, capital_allowances numeric DEFAULT 0)
 RETURNS TABLE(assessable_profit numeric, is_small_company boolean, cit_rate numeric, cit_due numeric, development_levy numeric, tertiary_education_tax numeric, total_tax_due numeric, breakdown jsonb)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_profit DECIMAL;
    v_is_small BOOLEAN;
    v_cit_rate DECIMAL;
    v_cit DECIMAL;
    v_dev_levy DECIMAL;
    v_tet DECIMAL;
    v_total DECIMAL;
    v_breakdown JSONB;
BEGIN
    -- Calculate assessable profit
    v_profit := GREATEST(0, gross_revenue - allowable_expenses - capital_allowances);
    
    -- Small company exemption: Revenue ≤ ₦100M
    v_is_small := gross_revenue <= 100000000;
    
    IF v_is_small THEN
        -- Small companies are exempt from CIT
        v_cit_rate := 0;
        v_cit := 0;
        v_dev_levy := 0;
        v_tet := 0;
    ELSE
        -- Standard CIT rate: 30%
        v_cit_rate := 0.30;
        v_cit := v_profit * v_cit_rate;
        
        -- Development Levy: 4% of assessable profit
        v_dev_levy := v_profit * 0.04;
        
        -- Tertiary Education Tax: 2.5% of assessable profit
        v_tet := v_profit * 0.025;
    END IF;
    
    v_total := v_cit + v_dev_levy + v_tet;
    
    v_breakdown := jsonb_build_object(
        'gross_revenue', gross_revenue,
        'allowable_expenses', allowable_expenses,
        'capital_allowances', capital_allowances,
        'assessable_profit', v_profit,
        'small_company_threshold', 100000000,
        'is_small_company', v_is_small,
        'cit_rate', v_cit_rate,
        'cit', v_cit,
        'development_levy_rate', 0.04,
        'development_levy', v_dev_levy,
        'tet_rate', 0.025,
        'tet', v_tet
    );
    
    RETURN QUERY SELECT
        ROUND(v_profit, 2),
        v_is_small,
        v_cit_rate,
        ROUND(v_cit, 2),
        ROUND(v_dev_levy, 2),
        ROUND(v_tet, 2),
        ROUND(v_total, 2),
        v_breakdown;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_pit_2026(gross_income numeric, pension_contribution numeric DEFAULT 0, nhf_contribution numeric DEFAULT 0, rent_paid numeric DEFAULT 0, other_reliefs numeric DEFAULT 0)
 RETURNS TABLE(chargeable_income numeric, consolidated_relief numeric, rent_relief numeric, total_reliefs numeric, tax_due numeric, effective_rate numeric, breakdown jsonb)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_cra DECIMAL;
    v_rent_relief DECIMAL;
    v_total_reliefs DECIMAL;
    v_chargeable_income DECIMAL;
    v_tax DECIMAL := 0;
    v_bracket_tax DECIMAL;
    v_remaining_income DECIMAL;
    v_breakdown JSONB := '[]'::JSONB;
    
    -- 2026 PIT Brackets (Nigeria Tax Act 2025)
    brackets DECIMAL[][] := ARRAY[
        [0, 800000, 0],
        [800000, 3000000, 0.15],
        [3000000, 12000000, 0.18],
        [12000000, 25000000, 0.21],
        [25000000, 50000000, 0.23],
        [50000000, 999999999999, 0.25]
    ];
    i INTEGER;
    bracket_min DECIMAL;
    bracket_max DECIMAL;
    bracket_rate DECIMAL;
    taxable_in_bracket DECIMAL;
BEGIN
    -- Calculate Consolidated Relief Allowance (CRA)
    -- Higher of: ₦200,000 OR 1% of gross income + 20% of gross income
    v_cra := GREATEST(200000, gross_income * 0.01 + gross_income * 0.20);
    
    -- Calculate Rent Relief (20% of rent paid, max ₦500,000)
    v_rent_relief := LEAST(500000, rent_paid * 0.20);
    
    -- Total reliefs
    v_total_reliefs := v_cra + pension_contribution + nhf_contribution + v_rent_relief + other_reliefs;
    
    -- Chargeable income
    v_chargeable_income := GREATEST(0, gross_income - v_total_reliefs);
    
    -- Progressive tax calculation
    v_remaining_income := v_chargeable_income;
    
    FOR i IN 1..array_length(brackets, 1) LOOP
        bracket_min := brackets[i][1];
        bracket_max := brackets[i][2];
        bracket_rate := brackets[i][3];
        
        IF v_remaining_income > 0 THEN
            IF v_chargeable_income > bracket_min THEN
                taxable_in_bracket := LEAST(
                    v_remaining_income,
                    bracket_max - bracket_min
                );
                
                IF taxable_in_bracket > 0 THEN
                    v_bracket_tax := taxable_in_bracket * bracket_rate;
                    v_tax := v_tax + v_bracket_tax;
                    v_remaining_income := v_remaining_income - taxable_in_bracket;
                    
                    -- Add to breakdown
                    v_breakdown := v_breakdown || jsonb_build_object(
                        'bracket_min', bracket_min,
                        'bracket_max', bracket_max,
                        'rate', bracket_rate,
                        'taxable_amount', taxable_in_bracket,
                        'tax', v_bracket_tax
                    );
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT
        ROUND(v_chargeable_income, 2),
        ROUND(v_cra, 2),
        ROUND(v_rent_relief, 2),
        ROUND(v_total_reliefs, 2),
        ROUND(v_tax, 2),
        CASE WHEN v_chargeable_income > 0 
            THEN ROUND((v_tax / v_chargeable_income) * 100, 2) 
            ELSE 0 
        END,
        v_breakdown;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_vat(taxable_supplies numeric, vat_rate numeric DEFAULT 0.075)
 RETURNS TABLE(vat_due numeric, effective_rate numeric)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY SELECT
        ROUND(taxable_supplies * vat_rate, 2),
        vat_rate * 100;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_transaction_hash(p_date date, p_amount numeric, p_description text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$ BEGIN RETURN encode(digest(p_date::TEXT || '|' || p_amount::TEXT || '|' || LOWER(TRIM(p_description)), 'sha256'), 'hex'); END; $function$
;

CREATE OR REPLACE FUNCTION public.get_active_rule_version()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    active_version_id UUID;
BEGIN
    SELECT id INTO active_version_id
    FROM rule_versions
    WHERE is_active = TRUE
    AND effective_from <= NOW()
    AND (effective_to IS NULL OR effective_to > NOW())
    ORDER BY effective_from DESC
    LIMIT 1;
    
    RETURN active_version_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  current_clerk_id TEXT;
  current_user_uuid UUID;
BEGIN
  -- Get Clerk user ID from JWT claims
  current_clerk_id := current_setting('request.jwt.claims', true)::json->>'sub';
  
  -- Return NULL if no JWT (allows service role operations)
  IF current_clerk_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Look up internal UUID from clerk_users table
  SELECT id INTO current_user_uuid 
  FROM public.clerk_users 
  WHERE clerk_user_id = current_clerk_id
  LIMIT 1;
  
  RETURN current_user_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  clerk_uuid UUID;
  supabase_uuid UUID;
BEGIN
  -- Try Clerk first
  clerk_uuid := public.get_clerk_user_id();
  IF clerk_uuid IS NOT NULL THEN
    RETURN clerk_uuid;
  END IF;
  
  -- Fallback to Supabase Auth (for backward compatibility during migration)
  BEGIN
    supabase_uuid := auth.uid();
    IF supabase_uuid IS NOT NULL THEN
      RETURN supabase_uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- auth.uid() not available, continue
  END;
  
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_tax_year_summary(p_user_id uuid, p_tax_year integer)
 RETURNS TABLE(total_income numeric, total_expenses numeric, total_deductible_expenses numeric, total_non_deductible_expenses numeric, total_capital_items numeric, net_income numeric, transaction_count integer, categorized_count integer, uncategorized_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    WITH summary AS (
        SELECT
            COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE 0 END), 0) as expenses,
            COALESCE(SUM(CASE 
                WHEN t.transaction_type = 'debit' AND c.tax_treatment = 'deductible' 
                THEN t.amount ELSE 0 
            END), 0) as deductible,
            COALESCE(SUM(CASE 
                WHEN t.transaction_type = 'debit' AND c.tax_treatment = 'non_deductible' 
                THEN t.amount ELSE 0 
            END), 0) as non_deductible,
            COALESCE(SUM(CASE 
                WHEN c.tax_treatment = 'capital' 
                THEN t.amount ELSE 0 
            END), 0) as capital,
            COUNT(*)::INTEGER as total_count,
            COUNT(t.category_id)::INTEGER as has_category,
            COUNT(*) FILTER (WHERE t.category_id IS NULL)::INTEGER as no_category
        FROM public.transactions t
        LEFT JOIN public.categories c ON t.category_id = c.id
        WHERE t.user_id = p_user_id
          AND t.tax_year = p_tax_year
    )
    SELECT
        income,
        expenses,
        deductible,
        non_deductible,
        capital,
        income - deductible, -- Net income (only deductible expenses reduce taxable income)
        total_count,
        has_category,
        no_category
    FROM summary;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    entity_type
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'entity_type')::entity_type,
      'individual'::entity_type
    )
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_user_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id, action, entity_type, entity_id, old_values, new_values
    ) VALUES (
        p_user_id, p_action, p_entity_type, p_entity_id, p_old_values, p_new_values
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_tax_calculation(p_user_id uuid, p_calculation_type text, p_inputs jsonb, p_outputs jsonb, p_ip_address inet, p_user_agent text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    active_version_id UUID;
    active_version_number TEXT;
    log_id UUID;
BEGIN
    -- Get active rule version
    SELECT id, version_number INTO active_version_id, active_version_number
    FROM rule_versions
    WHERE is_active = TRUE
    LIMIT 1;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        calculation_type,
        inputs,
        outputs,
        rule_version_id,
        rule_version_number,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_calculation_type,
        p_inputs,
        p_outputs,
        active_version_id,
        active_version_number,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_transaction_hash()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.transaction_hash := generate_transaction_hash(
        NEW.transaction_date,
        NEW.amount,
        NEW.description
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_tax_reports_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.suggest_category(p_description text, p_amount numeric, p_transaction_type public.transaction_type)
 RETURNS TABLE(category_id uuid, category_name text, confidence numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_desc_lower TEXT := LOWER(p_description);
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        CASE
            -- High confidence matches
            WHEN v_desc_lower LIKE '%salary%' OR v_desc_lower LIKE '%payroll%' THEN 0.95
            WHEN v_desc_lower LIKE '%rent%' AND p_transaction_type = 'debit' THEN 0.90
            WHEN v_desc_lower LIKE '%electricity%' OR v_desc_lower LIKE '%phcn%' OR v_desc_lower LIKE '%nepa%' THEN 0.90
            WHEN v_desc_lower LIKE '%airtime%' OR v_desc_lower LIKE '%recharge%' THEN 0.85
            WHEN v_desc_lower LIKE '%transfer%' THEN 0.50 -- Low confidence, could be anything
            WHEN v_desc_lower LIKE '%pos%' THEN 0.40
            -- Keyword matches from category
            WHEN EXISTS (
                SELECT 1 FROM unnest(c.keywords) k 
                WHERE v_desc_lower LIKE '%' || LOWER(k) || '%'
            ) THEN 0.75
            ELSE 0.30
        END::DECIMAL as conf
    FROM public.categories c
    WHERE 
        -- Match based on transaction type
        (p_transaction_type = 'credit' AND c.category_group = 'income')
        OR (p_transaction_type = 'debit' AND c.category_group IN ('expense', 'asset'))
    ORDER BY conf DESC
    LIMIT 3;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."file_uploads" to "anon";

grant insert on table "public"."file_uploads" to "anon";

grant references on table "public"."file_uploads" to "anon";

grant select on table "public"."file_uploads" to "anon";

grant trigger on table "public"."file_uploads" to "anon";

grant truncate on table "public"."file_uploads" to "anon";

grant update on table "public"."file_uploads" to "anon";

grant delete on table "public"."file_uploads" to "authenticated";

grant insert on table "public"."file_uploads" to "authenticated";

grant references on table "public"."file_uploads" to "authenticated";

grant select on table "public"."file_uploads" to "authenticated";

grant trigger on table "public"."file_uploads" to "authenticated";

grant truncate on table "public"."file_uploads" to "authenticated";

grant update on table "public"."file_uploads" to "authenticated";

grant delete on table "public"."file_uploads" to "service_role";

grant insert on table "public"."file_uploads" to "service_role";

grant references on table "public"."file_uploads" to "service_role";

grant select on table "public"."file_uploads" to "service_role";

grant trigger on table "public"."file_uploads" to "service_role";

grant truncate on table "public"."file_uploads" to "service_role";

grant update on table "public"."file_uploads" to "service_role";

grant delete on table "public"."financial_statements" to "anon";

grant insert on table "public"."financial_statements" to "anon";

grant references on table "public"."financial_statements" to "anon";

grant select on table "public"."financial_statements" to "anon";

grant trigger on table "public"."financial_statements" to "anon";

grant truncate on table "public"."financial_statements" to "anon";

grant update on table "public"."financial_statements" to "anon";

grant delete on table "public"."financial_statements" to "authenticated";

grant insert on table "public"."financial_statements" to "authenticated";

grant references on table "public"."financial_statements" to "authenticated";

grant select on table "public"."financial_statements" to "authenticated";

grant trigger on table "public"."financial_statements" to "authenticated";

grant truncate on table "public"."financial_statements" to "authenticated";

grant update on table "public"."financial_statements" to "authenticated";

grant delete on table "public"."financial_statements" to "service_role";

grant insert on table "public"."financial_statements" to "service_role";

grant references on table "public"."financial_statements" to "service_role";

grant select on table "public"."financial_statements" to "service_role";

grant trigger on table "public"."financial_statements" to "service_role";

grant truncate on table "public"."financial_statements" to "service_role";

grant update on table "public"."financial_statements" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."review_actions" to "anon";

grant insert on table "public"."review_actions" to "anon";

grant references on table "public"."review_actions" to "anon";

grant select on table "public"."review_actions" to "anon";

grant trigger on table "public"."review_actions" to "anon";

grant truncate on table "public"."review_actions" to "anon";

grant update on table "public"."review_actions" to "anon";

grant delete on table "public"."review_actions" to "authenticated";

grant insert on table "public"."review_actions" to "authenticated";

grant references on table "public"."review_actions" to "authenticated";

grant select on table "public"."review_actions" to "authenticated";

grant trigger on table "public"."review_actions" to "authenticated";

grant truncate on table "public"."review_actions" to "authenticated";

grant update on table "public"."review_actions" to "authenticated";

grant delete on table "public"."review_actions" to "service_role";

grant insert on table "public"."review_actions" to "service_role";

grant references on table "public"."review_actions" to "service_role";

grant select on table "public"."review_actions" to "service_role";

grant trigger on table "public"."review_actions" to "service_role";

grant truncate on table "public"."review_actions" to "service_role";

grant update on table "public"."review_actions" to "service_role";

grant delete on table "public"."review_queue" to "anon";

grant insert on table "public"."review_queue" to "anon";

grant references on table "public"."review_queue" to "anon";

grant select on table "public"."review_queue" to "anon";

grant trigger on table "public"."review_queue" to "anon";

grant truncate on table "public"."review_queue" to "anon";

grant update on table "public"."review_queue" to "anon";

grant delete on table "public"."review_queue" to "authenticated";

grant insert on table "public"."review_queue" to "authenticated";

grant references on table "public"."review_queue" to "authenticated";

grant select on table "public"."review_queue" to "authenticated";

grant trigger on table "public"."review_queue" to "authenticated";

grant truncate on table "public"."review_queue" to "authenticated";

grant update on table "public"."review_queue" to "authenticated";

grant delete on table "public"."review_queue" to "service_role";

grant insert on table "public"."review_queue" to "service_role";

grant references on table "public"."review_queue" to "service_role";

grant select on table "public"."review_queue" to "service_role";

grant trigger on table "public"."review_queue" to "service_role";

grant truncate on table "public"."review_queue" to "service_role";

grant update on table "public"."review_queue" to "service_role";

grant delete on table "public"."rule_versions" to "anon";

grant insert on table "public"."rule_versions" to "anon";

grant references on table "public"."rule_versions" to "anon";

grant select on table "public"."rule_versions" to "anon";

grant trigger on table "public"."rule_versions" to "anon";

grant truncate on table "public"."rule_versions" to "anon";

grant update on table "public"."rule_versions" to "anon";

grant delete on table "public"."rule_versions" to "authenticated";

grant insert on table "public"."rule_versions" to "authenticated";

grant references on table "public"."rule_versions" to "authenticated";

grant select on table "public"."rule_versions" to "authenticated";

grant trigger on table "public"."rule_versions" to "authenticated";

grant truncate on table "public"."rule_versions" to "authenticated";

grant update on table "public"."rule_versions" to "authenticated";

grant delete on table "public"."rule_versions" to "service_role";

grant insert on table "public"."rule_versions" to "service_role";

grant references on table "public"."rule_versions" to "service_role";

grant select on table "public"."rule_versions" to "service_role";

grant trigger on table "public"."rule_versions" to "service_role";

grant truncate on table "public"."rule_versions" to "service_role";

grant update on table "public"."rule_versions" to "service_role";

grant delete on table "public"."sources" to "anon";

grant insert on table "public"."sources" to "anon";

grant references on table "public"."sources" to "anon";

grant select on table "public"."sources" to "anon";

grant trigger on table "public"."sources" to "anon";

grant truncate on table "public"."sources" to "anon";

grant update on table "public"."sources" to "anon";

grant delete on table "public"."sources" to "authenticated";

grant insert on table "public"."sources" to "authenticated";

grant references on table "public"."sources" to "authenticated";

grant select on table "public"."sources" to "authenticated";

grant trigger on table "public"."sources" to "authenticated";

grant truncate on table "public"."sources" to "authenticated";

grant update on table "public"."sources" to "authenticated";

grant delete on table "public"."sources" to "service_role";

grant insert on table "public"."sources" to "service_role";

grant references on table "public"."sources" to "service_role";

grant select on table "public"."sources" to "service_role";

grant trigger on table "public"."sources" to "service_role";

grant truncate on table "public"."sources" to "service_role";

grant update on table "public"."sources" to "service_role";

grant delete on table "public"."tax_filings" to "anon";

grant insert on table "public"."tax_filings" to "anon";

grant references on table "public"."tax_filings" to "anon";

grant select on table "public"."tax_filings" to "anon";

grant trigger on table "public"."tax_filings" to "anon";

grant truncate on table "public"."tax_filings" to "anon";

grant update on table "public"."tax_filings" to "anon";

grant delete on table "public"."tax_filings" to "authenticated";

grant insert on table "public"."tax_filings" to "authenticated";

grant references on table "public"."tax_filings" to "authenticated";

grant select on table "public"."tax_filings" to "authenticated";

grant trigger on table "public"."tax_filings" to "authenticated";

grant truncate on table "public"."tax_filings" to "authenticated";

grant update on table "public"."tax_filings" to "authenticated";

grant delete on table "public"."tax_filings" to "service_role";

grant insert on table "public"."tax_filings" to "service_role";

grant references on table "public"."tax_filings" to "service_role";

grant select on table "public"."tax_filings" to "service_role";

grant trigger on table "public"."tax_filings" to "service_role";

grant truncate on table "public"."tax_filings" to "service_role";

grant update on table "public"."tax_filings" to "service_role";

grant delete on table "public"."tax_reports" to "anon";

grant insert on table "public"."tax_reports" to "anon";

grant references on table "public"."tax_reports" to "anon";

grant select on table "public"."tax_reports" to "anon";

grant trigger on table "public"."tax_reports" to "anon";

grant truncate on table "public"."tax_reports" to "anon";

grant update on table "public"."tax_reports" to "anon";

grant delete on table "public"."tax_reports" to "authenticated";

grant insert on table "public"."tax_reports" to "authenticated";

grant references on table "public"."tax_reports" to "authenticated";

grant select on table "public"."tax_reports" to "authenticated";

grant trigger on table "public"."tax_reports" to "authenticated";

grant truncate on table "public"."tax_reports" to "authenticated";

grant update on table "public"."tax_reports" to "authenticated";

grant delete on table "public"."tax_reports" to "service_role";

grant insert on table "public"."tax_reports" to "service_role";

grant references on table "public"."tax_reports" to "service_role";

grant select on table "public"."tax_reports" to "service_role";

grant trigger on table "public"."tax_reports" to "service_role";

grant truncate on table "public"."tax_reports" to "service_role";

grant update on table "public"."tax_reports" to "service_role";

grant delete on table "public"."tax_rules" to "anon";

grant insert on table "public"."tax_rules" to "anon";

grant references on table "public"."tax_rules" to "anon";

grant select on table "public"."tax_rules" to "anon";

grant trigger on table "public"."tax_rules" to "anon";

grant truncate on table "public"."tax_rules" to "anon";

grant update on table "public"."tax_rules" to "anon";

grant delete on table "public"."tax_rules" to "authenticated";

grant insert on table "public"."tax_rules" to "authenticated";

grant references on table "public"."tax_rules" to "authenticated";

grant select on table "public"."tax_rules" to "authenticated";

grant trigger on table "public"."tax_rules" to "authenticated";

grant truncate on table "public"."tax_rules" to "authenticated";

grant update on table "public"."tax_rules" to "authenticated";

grant delete on table "public"."tax_rules" to "service_role";

grant insert on table "public"."tax_rules" to "service_role";

grant references on table "public"."tax_rules" to "service_role";

grant select on table "public"."tax_rules" to "service_role";

grant trigger on table "public"."tax_rules" to "service_role";

grant truncate on table "public"."tax_rules" to "service_role";

grant update on table "public"."tax_rules" to "service_role";


  create policy "Allow service role to manage audit logs"
  on "public"."audit_logs"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can insert their own audit logs"
  on "public"."audit_logs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can read their own audit logs"
  on "public"."audit_logs"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Bank configs are viewable by authenticated users"
  on "public"."bank_configs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "categories_all_service_role"
  on "public"."categories"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "categories_select_authenticated"
  on "public"."categories"
  as permissive
  for select
  to authenticated
using (true);



  create policy "clerk_users_insert_own"
  on "public"."clerk_users"
  as permissive
  for insert
  to public
with check (((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)));



  create policy "clerk_users_select_own"
  on "public"."clerk_users"
  as permissive
  for select
  to public
using (((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)));



  create policy "clerk_users_service_role"
  on "public"."clerk_users"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "clerk_users_update_own"
  on "public"."clerk_users"
  as permissive
  for update
  to public
using (((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)));



  create policy "Users can delete own uploads"
  on "public"."file_uploads"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own uploads"
  on "public"."file_uploads"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own uploads"
  on "public"."file_uploads"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own uploads"
  on "public"."file_uploads"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can create own financial statements"
  on "public"."financial_statements"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can delete own financial statements"
  on "public"."financial_statements"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can update own financial statements"
  on "public"."financial_statements"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own financial statements"
  on "public"."financial_statements"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete own draft invoices"
  on "public"."invoices"
  as permissive
  for delete
  to public
using (((auth.uid() = user_id) AND (status = 'draft'::text)));



  create policy "Users can insert own invoices"
  on "public"."invoices"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own invoices"
  on "public"."invoices"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view own invoices"
  on "public"."invoices"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Allow service role to manage profiles"
  on "public"."profiles"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Enable insert for authenticated users only"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can read their own profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "profiles_insert_clerk"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)) OR (id = auth.uid())));



  create policy "profiles_select_clerk"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)) OR (id = auth.uid())));



  create policy "profiles_update_clerk"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)) OR (id = auth.uid())));



  create policy "Allow authenticated users to insert review queue"
  on "public"."review_queue"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Allow authenticated users to read review queue"
  on "public"."review_queue"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow service role to manage review queue"
  on "public"."review_queue"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Allow authenticated users to read rule versions"
  on "public"."rule_versions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow service role to manage rule versions"
  on "public"."rule_versions"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Allow authenticated users to read sources"
  on "public"."sources"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow service role to manage sources"
  on "public"."sources"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can delete own draft filings"
  on "public"."tax_filings"
  as permissive
  for delete
  to public
using (((auth.uid() = user_id) AND (status = 'draft'::public.filing_status)));



  create policy "Users can insert own filings"
  on "public"."tax_filings"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own filings"
  on "public"."tax_filings"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view own filings"
  on "public"."tax_filings"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete own tax reports"
  on "public"."tax_reports"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own tax reports"
  on "public"."tax_reports"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own tax reports"
  on "public"."tax_reports"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view own tax reports"
  on "public"."tax_reports"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Allow authenticated users to read tax rules"
  on "public"."tax_rules"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow service role to manage tax rules"
  on "public"."tax_rules"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "transactions_all_service_role"
  on "public"."transactions"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "transactions_delete_clerk"
  on "public"."transactions"
  as permissive
  for delete
  to authenticated
using ((((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)) OR (user_id = auth.uid())));



  create policy "transactions_delete_own"
  on "public"."transactions"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "transactions_insert_clerk"
  on "public"."transactions"
  as permissive
  for insert
  to authenticated
with check ((((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)) OR (user_id = auth.uid())));



  create policy "transactions_insert_own"
  on "public"."transactions"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "transactions_select_clerk"
  on "public"."transactions"
  as permissive
  for select
  to authenticated
using ((((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)) OR (user_id = auth.uid())));



  create policy "transactions_select_own"
  on "public"."transactions"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "transactions_update_clerk"
  on "public"."transactions"
  as permissive
  for update
  to authenticated
using ((((clerk_user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)) OR (user_id = auth.uid())));



  create policy "transactions_update_own"
  on "public"."transactions"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clerk_users_updated_at BEFORE UPDATE ON public.clerk_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_statements_updated_at BEFORE UPDATE ON public.financial_statements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_queue_updated_at BEFORE UPDATE ON public.review_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rule_versions_updated_at BEFORE UPDATE ON public.rule_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON public.sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_filings_updated_at BEFORE UPDATE ON public.tax_filings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_tax_reports_updated_at BEFORE UPDATE ON public.tax_reports FOR EACH ROW EXECUTE FUNCTION public.update_tax_reports_updated_at();

CREATE TRIGGER update_tax_rules_updated_at BEFORE UPDATE ON public.tax_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Users can delete own bank statements"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'bank-statements'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own bank statements"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'bank-statements'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own documents"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can view own bank statements"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'bank-statements'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can view own documents"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



