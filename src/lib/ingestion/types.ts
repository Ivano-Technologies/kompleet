/**
 * Shared TypeScript interfaces for the ingestion pipeline
 * Canonical schema for all transaction data
 */

export interface Transaction {
  // Core fields (required)
  id: string; // UUID, generated on insert
  user_id: string; // From auth context
  source_file_id: string; // Reference to uploaded file
  date: string; // ISO 8601 format: YYYY-MM-DD
  description: string; // Transaction narration/merchant
  amount: number; // Absolute value (always positive)
  type: 'debit' | 'credit'; // Transaction direction

  // Optional fields
  currency?: string; // ISO 4217 code (default: NGN)
  balance?: number; // Running balance after transaction
  reference?: string; // Bank reference number
  bank_name?: string; // Originating bank

  // AI Categorization fields
  category?: string; // Assigned category
  confidence_score?: number; // 0.0 to 1.0
  categorization_method?: 'LLM' | 'RULE' | 'ML' | 'MANUAL';
  requires_review?: boolean; // true if confidence < 0.65

  // Metadata
  raw_category?: string; // Category from bank statement
  raw_data?: Record<string, any>; // Original parsed row
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface ParseResult {
  transactions: Transaction[];
  errors: ParseError[];
  totalRows: number;
  successfulRows: number;
  fileMetadata?: {
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'xlsx' | 'xls' | 'csv' | 'zip';
    isEncrypted: boolean;
    pageCount?: number;
    sheetName?: string;
  };
}

export interface ParseError {
  rowNumber: number;
  errorType: string;
  errorMessage: string;
  rawData?: Record<string, any>;
}

export interface IngestionRequest {
  file: File;
  password?: string; // Optional, for encrypted files
  bankCode?: string; // Optional, for bank-specific parsing
}

export interface IngestionResponse {
  success: boolean;
  transactionCount: number;
  errors: ParseError[];
  aiJobId?: string; // Job ID for async categorization
  message?: string;
}

export interface SanitizedTransaction {
  date: string;
  description: string;
  amount: number;
  currency: string;
  balance?: number;
  // NO: account numbers, customer names, addresses, etc.
}

export interface EncryptionInfo {
  isEncrypted: boolean;
  encryptionType?: 'password' | 'certificate' | 'unknown';
  requiresPassword: boolean;
}

export interface RawRow {
  date: string; // Any format: DD/MM/YYYY, MM/DD/YYYY, etc.
  description: string; // Merchant/narration
  amount: string; // May include currency symbols, commas
  balance?: string; // Optional running balance
  reference?: string; // Optional transaction reference
  type?: string; // May be 'DR', 'CR', 'DEBIT', 'CREDIT'
  [key: string]: any; // Other fields from bank
}
