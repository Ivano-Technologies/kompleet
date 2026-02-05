// Calculation History Types for KOMPLEET Platform

export interface CalculationHistory {
  id: string;
  user_id: string;
  calculation_type: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  rule_version_id: string;
  created_at: string;
  updated_at: string;
}

export interface CalculationHistoryFilters {
  type?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CalculationHistoryResponse {
  data: CalculationHistory[];
  total: number;
  limit: number;
  offset: number;
}

export interface CalculationDetail extends CalculationHistory {
  rule_version: {
    version: string;
    effective_date: string;
  };
  sources: Array<{
    name: string;
    confidence_level: string;
  }>;
}
