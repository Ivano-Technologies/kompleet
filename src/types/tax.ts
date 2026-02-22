/**
 * Tax Rules Engine Types
 */

export type SourceType = "primary" | "secondary";

export type RuleType =
  | "individual_income_tax"
  | "business_tax"
  | "vat"
  | "stamp_duty"
  | "capital_allowance"
  | "development_levy"
  | "property_tax";

export type ConfidenceLevel = "high" | "medium" | "low";

export type ReviewStatus = "pending" | "in_review" | "approved" | "rejected";

export type ReviewPriority = "low" | "medium" | "high" | "critical";

export type ChangeType = "new_rule" | "rule_update" | "rule_deprecation";

export type ReviewActionType =
  | "assigned"
  | "commented"
  | "approved"
  | "rejected"
  | "requested_changes";

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  description?: string;
  check_frequency_days: number;
  last_checked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RuleVersion {
  id: string;
  version_number: string;
  description?: string;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaxRule {
  id: string;
  rule_version_id: string;
  source_id: string;
  rule_type: RuleType;
  rule_key: string;
  rule_value: Record<string, any>;
  confidence_level: ConfidenceLevel;
  last_reviewed_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  source?: Source;
  rule_version?: RuleVersion;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  calculation_type: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  rule_version_id: string;
  rule_version_number: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ReviewQueueItem {
  id: string;
  source_id: string;
  change_type: ChangeType;
  change_summary: string;
  change_details: Record<string, any>;
  proposed_rule_changes?: Record<string, any>;
  status: ReviewStatus;
  priority: ReviewPriority;
  assigned_to?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  source?: Source;
}

export interface ReviewAction {
  id: string;
  review_queue_id: string;
  action_type: ReviewActionType;
  action_by: string;
  action_details?: string;
  created_at: string;
}

// API Request/Response Types

export interface GetRulesRequest {
  version_id?: string;
  rule_type?: RuleType;
  rule_keys?: string[];
}

export interface GetRulesResponse {
  rules: TaxRule[];
  version: RuleVersion;
  source: string;
}

export interface CalculateTaxRequest {
  calculation_type: string;
  inputs: Record<string, any>;
}

export interface CalculateTaxResponse {
  outputs: Record<string, any>;
  breakdown: Record<string, any>;
  rule_version: string;
  sources: Source[];
  last_reviewed: string;
  confidence_level: ConfidenceLevel;
  disclaimer: string;
}

export interface CreateReviewRequest {
  source_id: string;
  change_type: ChangeType;
  change_summary: string;
  change_details: Record<string, any>;
  proposed_rule_changes?: Record<string, any>;
  priority: ReviewPriority;
}

export interface ApproveReviewRequest {
  review_id: string;
  review_notes?: string;
  apply_changes: boolean;
}

// Tax Calculation Types

export interface IndividualIncomeTaxInput {
  annual_income: number;
  reliefs?: {
    consolidated_relief?: number;
    pension?: number;
    nhf?: number;
    nhis?: number;
    life_insurance?: number;
  };
}

export interface BusinessTaxInput {
  turnover: number;
  expenses: number;
  capital_allowances?: number;
  is_small_company?: boolean;
}

export interface VATInput {
  taxable_supplies: number;
  exempt_supplies?: number;
  zero_rated_supplies?: number;
}

export interface StampDutyInput {
  transaction_type: "property" | "lease" | "shares" | "loan";
  transaction_value: number;
  location?: string;
}

export interface CapitalAllowanceInput {
  asset_type: string;
  asset_cost: number;
  acquisition_date: string;
}
