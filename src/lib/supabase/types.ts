/**
 * Database Types
 * ==============
 * TypeScript types generated from Supabase schema.
 * These types match the tables defined in our migrations.
 *
 * REGENERATING:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 *
 * Or manually update when schema changes.
 */

// ============================================================
// ENUM TYPES
// ============================================================

export type EntityType = "individual" | "company";

export type TransactionType = "credit" | "debit";

export type TaxTreatmentType =
  | "taxable"
  | "deductible"
  | "exempt"
  | "non_deductible"
  | "capital";

export type CategoryGroupType =
  | "income"
  | "expense"
  | "transfer"
  | "tax"
  | "personal";

export type SubscriptionTierType =
  | "free"
  | "starter"
  | "professional"
  | "enterprise";

export type TaxType = "pit" | "cit" | "vat" | "wht";

export type AuditActionType =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "export"
  | "login"
  | "logout";

export type ReportStatusType =
  | "pending"
  | "generating"
  | "completed"
  | "failed";

export type ImportStatusType =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "partial";

export type WhtCategoryType =
  | "dividends"
  | "interest"
  | "royalties"
  | "rent"
  | "commission"
  | "consultancy"
  | "technical_services"
  | "management_services"
  | "directors_fees"
  | "contracts";

export type MemberRoleType = "owner" | "accountant" | "staff";

/** Wave A firm membership. Viewer is deferred. */
export type FirmRoleType = "owner" | "staff";

// ============================================================
// JSON TYPES
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================
// DATABASE SCHEMA
// ============================================================

export interface Database {
  public: {
    Tables: {
      // ----------------------------------------------------------
      // PROFILES
      // ----------------------------------------------------------
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          entity_type: EntityType;
          tin: string | null;
          company_name: string | null;
          rc_number: string | null;
          company_address: string | null;
          vat_registered: boolean;
          vat_number: string | null;
          subscription_tier: SubscriptionTierType;
          subscription_expires_at: string | null;
          monthly_transaction_count: number;
          last_transaction_reset: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          entity_type?: EntityType;
          tin?: string | null;
          company_name?: string | null;
          rc_number?: string | null;
          company_address?: string | null;
          vat_registered?: boolean;
          vat_number?: string | null;
          subscription_tier?: SubscriptionTierType;
          subscription_expires_at?: string | null;
          monthly_transaction_count?: number;
          last_transaction_reset?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          entity_type?: EntityType;
          tin?: string | null;
          company_name?: string | null;
          rc_number?: string | null;
          company_address?: string | null;
          vat_registered?: boolean;
          vat_number?: string | null;
          subscription_tier?: SubscriptionTierType;
          subscription_expires_at?: string | null;
          monthly_transaction_count?: number;
          last_transaction_reset?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // CATEGORIES
      // ----------------------------------------------------------
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category_group: CategoryGroupType;
          tax_treatment: TaxTreatmentType;
          keywords: string[];
          wht_category: WhtCategoryType | null;
          vat_applicable: boolean;
          is_system: boolean;
          display_order: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category_group: CategoryGroupType;
          tax_treatment: TaxTreatmentType;
          keywords?: string[];
          wht_category?: WhtCategoryType | null;
          vat_applicable?: boolean;
          is_system?: boolean;
          display_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category_group?: CategoryGroupType;
          tax_treatment?: TaxTreatmentType;
          keywords?: string[];
          wht_category?: WhtCategoryType | null;
          vat_applicable?: boolean;
          is_system?: boolean;
          display_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // TRANSACTIONS
      // ----------------------------------------------------------
      transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_date: string;
          description: string;
          amount: number;
          transaction_type: TransactionType;
          running_balance: number | null;
          category_id: string | null;
          is_verified: boolean;
          ai_confidence: number | null;
          source: string;
          source_bank: string | null;
          source_file_name: string | null;
          import_batch_id: string | null;
          tax_year: number;
          hash: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_date: string;
          description: string;
          amount: number;
          transaction_type: TransactionType;
          running_balance?: number | null;
          category_id?: string | null;
          is_verified?: boolean;
          ai_confidence?: number | null;
          source?: string;
          source_bank?: string | null;
          source_file_name?: string | null;
          import_batch_id?: string | null;
          tax_year: number;
          hash: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_date?: string;
          description?: string;
          amount?: number;
          transaction_type?: TransactionType;
          running_balance?: number | null;
          category_id?: string | null;
          is_verified?: boolean;
          ai_confidence?: number | null;
          source?: string;
          source_bank?: string | null;
          source_file_name?: string | null;
          import_batch_id?: string | null;
          tax_year?: number;
          hash?: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_transactions_import_batch";
            columns: ["import_batch_id"];
            referencedRelation: "import_batches";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // TAX CALCULATIONS
      // ----------------------------------------------------------
      tax_calculations: {
        Row: {
          id: string;
          user_id: string;
          tax_type: TaxType;
          tax_year: number;
          calculation_date: string;
          input_data: Json;
          gross_amount: number;
          deductions: number;
          taxable_amount: number;
          tax_due: number;
          effective_rate: number | null;
          breakdown: Json;
          is_final: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_type: TaxType;
          tax_year: number;
          calculation_date?: string;
          input_data?: Json;
          gross_amount: number;
          deductions?: number;
          taxable_amount: number;
          tax_due: number;
          effective_rate?: number | null;
          breakdown?: Json;
          is_final?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_type?: TaxType;
          tax_year?: number;
          calculation_date?: string;
          input_data?: Json;
          gross_amount?: number;
          deductions?: number;
          taxable_amount?: number;
          tax_due?: number;
          effective_rate?: number | null;
          breakdown?: Json;
          is_final?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tax_calculations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // REPORTS
      // ----------------------------------------------------------
      reports: {
        Row: {
          id: string;
          user_id: string;
          report_type: string;
          report_name: string;
          tax_year: number | null;
          status: ReportStatusType;
          file_path: string | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          error_message: string | null;
          parameters: Json;
          generated_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          report_type: string;
          report_name: string;
          tax_year?: number | null;
          status?: ReportStatusType;
          file_path?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          error_message?: string | null;
          parameters?: Json;
          generated_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          report_type?: string;
          report_name?: string;
          tax_year?: number | null;
          status?: ReportStatusType;
          file_path?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          error_message?: string | null;
          parameters?: Json;
          generated_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // AUDIT LOGS
      // ----------------------------------------------------------
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: AuditActionType;
          table_name: string;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: AuditActionType;
          table_name: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          // Audit logs are immutable, no updates allowed
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // IMPORT BATCHES
      // ----------------------------------------------------------
      import_batches: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_type: string;
          file_size_bytes: number | null;
          bank_name: string | null;
          total_rows: number;
          imported_count: number;
          duplicate_count: number;
          error_count: number;
          status: ImportStatusType;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_type: string;
          file_size_bytes?: number | null;
          bank_name?: string | null;
          total_rows?: number;
          imported_count?: number;
          duplicate_count?: number;
          error_count?: number;
          status?: ImportStatusType;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_type?: string;
          file_size_bytes?: number | null;
          bank_name?: string | null;
          total_rows?: number;
          imported_count?: number;
          duplicate_count?: number;
          error_count?: number;
          status?: ImportStatusType;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "import_batches_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // AI CATEGORY OVERRIDES
      // ----------------------------------------------------------
      ai_category_overrides: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          description_hash: string;
          original_category_id: string | null;
          corrected_category_id: string;
          frequency: number;
          last_used_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          description_hash: string;
          original_category_id?: string | null;
          corrected_category_id: string;
          frequency?: number;
          last_used_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          description_hash?: string;
          original_category_id?: string | null;
          corrected_category_id?: string;
          frequency?: number;
          last_used_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_overrides_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_overrides_original_category_fkey";
            columns: ["original_category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_overrides_corrected_category_fkey";
            columns: ["corrected_category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // AI AUDIT LOGS
      // ----------------------------------------------------------
      ai_audit_logs: {
        Row: {
          id: string;
          user_id: string;
          operation: string;
          request_hash: string;
          input_tokens: number;
          input_summary: string | null;
          output_tokens: number;
          model: string;
          provider: string;
          latency_ms: number;
          cached: boolean;
          success: boolean;
          error_message: string | null;
          result_count: number;
          average_confidence: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          operation: string;
          request_hash: string;
          input_tokens?: number;
          input_summary?: string | null;
          output_tokens?: number;
          model: string;
          provider: string;
          latency_ms?: number;
          cached?: boolean;
          success: boolean;
          error_message?: string | null;
          result_count?: number;
          average_confidence?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          // AI audit logs are append-only, no updates
        };
        Relationships: [
          {
            foreignKeyName: "ai_audit_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // INVOICES
      // ----------------------------------------------------------
      invoices: {
        Row: {
          id: string;
          user_id: string;
          invoice_number: string;
          invoice_date: string;
          due_date: string | null;
          customer_info: Json;
          line_items: Json;
          subtotal: number;
          vat_amount: number;
          discount_amount: number;
          total_amount: number;
          status: string;
          tax_year: number;
          payment_terms: string | null;
          notes: string | null;
          signature_hash: string | null;
          qr_payload: string | null;
          is_immutable: boolean;
          created_at: string;
          issued_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          invoice_number: string;
          invoice_date: string;
          due_date?: string | null;
          customer_info: Json;
          line_items: Json;
          subtotal: number;
          vat_amount: number;
          discount_amount?: number;
          total_amount: number;
          status?: string;
          tax_year: number;
          payment_terms?: string | null;
          notes?: string | null;
          signature_hash?: string | null;
          qr_payload?: string | null;
          is_immutable?: boolean;
          created_at?: string;
          issued_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          invoice_number?: string;
          invoice_date?: string;
          due_date?: string | null;
          customer_info?: Json;
          line_items?: Json;
          subtotal?: number;
          vat_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          status?: string;
          tax_year?: number;
          payment_terms?: string | null;
          notes?: string | null;
          signature_hash?: string | null;
          qr_payload?: string | null;
          is_immutable?: boolean;
          created_at?: string;
          issued_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      firms: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string;
          subscription_tier: SubscriptionTierType;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_user_id: string;
          subscription_tier?: SubscriptionTierType;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_user_id?: string;
          subscription_tier?: SubscriptionTierType;
          created_at?: string;
        };
        Relationships: [];
      };

      firm_members: {
        Row: {
          firm_id: string;
          user_id: string;
          role: FirmRoleType;
        };
        Insert: {
          firm_id: string;
          user_id: string;
          role: FirmRoleType;
        };
        Update: {
          firm_id?: string;
          user_id?: string;
          role?: FirmRoleType;
        };
        Relationships: [
          {
            foreignKeyName: "firm_members_firm_id_fkey";
            columns: ["firm_id"];
            referencedRelation: "firms";
            referencedColumns: ["id"];
          },
        ];
      };

      clients: {
        Row: {
          id: string;
          firm_id: string;
          legal_name: string;
          tin: string | null;
          rc_number: string | null;
          entity_type: EntityType | null;
          fiscal_year_start: string | null;
          address: string | null;
          status: string;
          archived_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          firm_id: string;
          legal_name: string;
          tin?: string | null;
          rc_number?: string | null;
          entity_type?: EntityType | null;
          fiscal_year_start?: string | null;
          address?: string | null;
          status?: string;
          archived_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          firm_id?: string;
          legal_name?: string;
          tin?: string | null;
          rc_number?: string | null;
          entity_type?: EntityType | null;
          fiscal_year_start?: string | null;
          address?: string | null;
          status?: string;
          archived_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_firm_id_fkey";
            columns: ["firm_id"];
            referencedRelation: "firms";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {
      // No views defined yet
    };

    Functions: {
      // ----------------------------------------------------------
      // HELPER FUNCTIONS
      // ----------------------------------------------------------
      generate_transaction_hash: {
        Args: {
          p_date: string;
          p_amount: number;
          p_description: string;
        };
        Returns: string;
      };
      determine_tax_year: {
        Args: {
          p_date: string;
        };
        Returns: number;
      };
      kobo_to_naira: {
        Args: {
          p_kobo: number;
        };
        Returns: number;
      };
      naira_to_kobo: {
        Args: {
          p_naira: number;
        };
        Returns: number;
      };
      normalize_description: {
        Args: {
          p_description: string;
        };
        Returns: string;
      };
      generate_description_hash: {
        Args: {
          p_description: string;
        };
        Returns: string;
      };
      reset_monthly_transaction_counts: {
        Args: Record<string, never>;
        Returns: number;
      };
      my_firm_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      accessible_client_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };

    Enums: {
      entity_type: EntityType;
      transaction_type: TransactionType;
      tax_treatment_type: TaxTreatmentType;
      category_group_type: CategoryGroupType;
      subscription_tier_type: SubscriptionTierType;
      tax_type: TaxType;
      audit_action_type: AuditActionType;
      report_status_type: ReportStatusType;
      import_status_type: ImportStatusType;
      wht_category_type: WhtCategoryType;
      member_role_type: MemberRoleType;
    };

    CompositeTypes: {
      // No composite types defined
    };
  };
}

// ============================================================
// HELPER TYPES
// ============================================================

/**
 * Extract the Row type for a table
 */
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/**
 * Extract the Insert type for a table
 */
export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/**
 * Extract the Update type for a table
 */
export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// ============================================================
// CONVENIENCE TYPE ALIASES
// ============================================================

export type Profile = TableRow<"profiles">;
export type ProfileInsert = TableInsert<"profiles">;
export type ProfileUpdate = TableUpdate<"profiles">;

export type Category = TableRow<"categories">;
export type CategoryInsert = TableInsert<"categories">;
export type CategoryUpdate = TableUpdate<"categories">;

export type Transaction = TableRow<"transactions">;
export type TransactionInsert = TableInsert<"transactions">;
export type TransactionUpdate = TableUpdate<"transactions">;

export type TaxCalculation = TableRow<"tax_calculations">;
export type TaxCalculationInsert = TableInsert<"tax_calculations">;
export type TaxCalculationUpdate = TableUpdate<"tax_calculations">;

export type Report = TableRow<"reports">;
export type ReportInsert = TableInsert<"reports">;
export type ReportUpdate = TableUpdate<"reports">;

export type AuditLog = TableRow<"audit_logs">;
export type AuditLogInsert = TableInsert<"audit_logs">;

export type ImportBatch = TableRow<"import_batches">;
export type ImportBatchInsert = TableInsert<"import_batches">;
export type ImportBatchUpdate = TableUpdate<"import_batches">;

export type AICategoryOverride = TableRow<"ai_category_overrides">;
export type AICategoryOverrideInsert = TableInsert<"ai_category_overrides">;
export type AICategoryOverrideUpdate = TableUpdate<"ai_category_overrides">;

export type AIAuditLog = TableRow<"ai_audit_logs">;
export type AIAuditLogInsert = TableInsert<"ai_audit_logs">;

export type Firm = TableRow<"firms">;
export type FirmInsert = TableInsert<"firms">;
export type FirmUpdate = TableUpdate<"firms">;

export type FirmMember = TableRow<"firm_members">;
export type FirmMemberInsert = TableInsert<"firm_members">;
export type FirmMemberUpdate = TableUpdate<"firm_members">;

export type Client = TableRow<"clients">;
export type ClientInsert = TableInsert<"clients">;
export type ClientUpdate = TableUpdate<"clients">;
