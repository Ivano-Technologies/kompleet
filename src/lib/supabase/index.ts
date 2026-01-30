/**
 * Supabase Module Exports
 * =======================
 * Central export point for all Supabase utilities.
 * 
 * ARCHITECTURE:
 *   - Browser-only (no SSR)
 *   - No @supabase/ssr dependency
 *   - No middleware
 *   - Explicit client parameter pattern
 *
 * USAGE:
 *   import { 
 *     createSupabaseClient,
 *     signInWithEmail,
 *     getTransactions 
 *   } from '@/lib/supabase';
 *
 *   const supabase = createSupabaseClient();
 *   await signInWithEmail(supabase, email, password);
 *   const { data } = await getTransactions(supabase, { taxYear: 2024 });
 */

// ============================================================
// CLIENT
// ============================================================

export {
  createSupabaseClient,
  createSupabaseClientWithOptions,
  type TypedSupabaseClient,
  type SupabaseClient,
  type Session,
  type User,
} from './client';

// ============================================================
// AUTH
// ============================================================

export {
  // Sign in
  signInWithEmail,
  signInWithOAuth,
  signInWithPhone,
  verifyPhoneOTP,
  // Sign up
  signUpWithEmail,
  // Sign out
  signOut,
  // Session & user
  getSession,
  getCurrentUser,
  isAuthenticated,
  // Password
  resetPassword,
  updatePassword,
  // State listener
  onAuthStateChange,
  // Types
  type AuthResult,
  type SignInResult,
  type SignUpResult,
} from './auth';

// ============================================================
// QUERIES
// ============================================================

export {
  // Profile
  getProfile,
  updateProfile,
  // Categories
  getCategories,
  getCategory,
  getCategoriesGrouped,
  // Transactions
  getTransactions,
  getTransaction,
  getUncategorizedCount,
  getTransactionTotals,
  updateTransactionCategory,
  getAvailableTaxYears,
  // Tax calculations
  getTaxCalculations,
  getLatestTaxCalculation,
  // Import batches
  getImportBatches,
  getImportBatch,
  // Dashboard
  getDashboardSummary,
  // Types
  type QueryResult,
  type QueryListResult,
  type PaginatedResult,
  type PaginationParams,
  type TransactionFilters,
  type TransactionQueryParams,
  type TransactionWithCategory,
} from './queries';

// ============================================================
// DATABASE TYPES
// ============================================================

export type {
  // Database
  Database,
  Json,
  // Enums
  EntityType,
  TransactionType,
  TaxTreatmentType,
  CategoryGroupType,
  SubscriptionTierType,
  TaxType,
  AuditActionType,
  ReportStatusType,
  ImportStatusType,
  WhtCategoryType,
  MemberRoleType,
  // Helper types
  TableRow,
  TableInsert,
  TableUpdate,
  // Entity types
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Category,
  CategoryInsert,
  CategoryUpdate,
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TaxCalculation,
  TaxCalculationInsert,
  TaxCalculationUpdate,
  Report,
  ReportInsert,
  ReportUpdate,
  AuditLog,
  AuditLogInsert,
  ImportBatch,
  ImportBatchInsert,
  ImportBatchUpdate,
  AICategoryOverride,
  AICategoryOverrideInsert,
  AICategoryOverrideUpdate,
  AIAuditLog,
  AIAuditLogInsert,
} from './types';
