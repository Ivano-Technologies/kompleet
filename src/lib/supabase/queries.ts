/**
 * Database Queries (Client-Side)
 * ==============================
 * Typed query functions for the KOMPLEET database.
 * 
 * All functions require an explicit Supabase client parameter.
 * This pattern:
 *   - Makes functions testable (pass mock client)
 *   - Avoids hidden global state
 *   - Works in any context (React, tests, scripts)
 *
 * USAGE:
 *   import { createSupabaseClient } from '@/lib/supabase/client';
 *   import { getTransactions, getCategories } from '@/lib/supabase/queries';
 *
 *   const supabase = createSupabaseClient();
 *   const { data, error } = await getTransactions(supabase, { taxYear: 2024 });
 */

import type { TypedSupabaseClient } from './client';
import type {
  Transaction,
  Category,
  Profile,
  TaxCalculation,
  ImportBatch,
  TransactionType,
  CategoryGroupType,
} from './types';

// ============================================================
// RESULT TYPES
// ============================================================

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

export interface QueryListResult<T> {
  data: T[];
  error: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

// ============================================================
// QUERY PARAMETERS
// ============================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface TransactionFilters {
  taxYear?: number;
  categoryId?: string | null;
  transactionType?: TransactionType;
  isVerified?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  importBatchId?: string;
}

export interface TransactionQueryParams extends TransactionFilters, PaginationParams {
  orderBy?: 'transaction_date' | 'amount' | 'created_at';
  orderDir?: 'asc' | 'desc';
}

// ============================================================
// JOINED TYPES
// ============================================================

export interface TransactionWithCategory extends Transaction {
  category: Category | null;
}

// ============================================================
// PROFILE QUERIES
// ============================================================

/**
 * Get the current user's profile.
 *
 * @example
 * const { data: profile, error } = await getProfile(supabase, userId);
 */
export async function getProfile(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<QueryResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Update user profile.
 *
 * @example
 * const { error } = await updateProfile(supabase, userId, {
 *   full_name: 'John Doe',
 *   entity_type: 'company'
 * });
 */
export async function updateProfile(
  supabase: TypedSupabaseClient,
  userId: string,
  updates: Partial<Pick<Profile, 
    | 'full_name' 
    | 'phone' 
    | 'entity_type' 
    | 'tin' 
    | 'company_name' 
    | 'rc_number' 
    | 'company_address'
    | 'vat_registered'
    | 'vat_number'
  >>
): Promise<QueryResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// ============================================================
// CATEGORY QUERIES
// ============================================================

/**
 * Get all active categories.
 *
 * @example
 * const { data: categories } = await getCategories(supabase);
 */
export async function getCategories(
  supabase: TypedSupabaseClient
): Promise<QueryListResult<Category>> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

/**
 * Get a single category by ID.
 */
export async function getCategory(
  supabase: TypedSupabaseClient,
  categoryId: string
): Promise<QueryResult<Category>> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Get categories grouped by category_group.
 *
 * @example
 * const { data: grouped } = await getCategoriesGrouped(supabase);
 * // { income: [...], expense: [...], transfer: [...] }
 */
export async function getCategoriesGrouped(
  supabase: TypedSupabaseClient
): Promise<QueryResult<Record<CategoryGroupType, Category[]>>> {
  const { data, error } = await getCategories(supabase);

  if (error) {
    return { data: null, error };
  }

  const grouped: Record<string, Category[]> = {
    income: [],
    expense: [],
    transfer: [],
    tax: [],
    personal: [],
  };

  for (const category of data) {
    const group = category.category_group;
    if (grouped[group]) {
      grouped[group].push(category);
    }
  }

  return { data: grouped as Record<CategoryGroupType, Category[]>, error: null };
}

// ============================================================
// TRANSACTION QUERIES
// ============================================================

/**
 * Get paginated transactions with optional filters.
 *
 * @example
 * const result = await getTransactions(supabase, {
 *   taxYear: 2024,
 *   transactionType: 'debit',
 *   page: 1,
 *   pageSize: 20
 * });
 */
export async function getTransactions(
  supabase: TypedSupabaseClient,
  params: TransactionQueryParams = {}
): Promise<PaginatedResult<TransactionWithCategory>> {
  const {
    taxYear,
    categoryId,
    transactionType,
    isVerified,
    search,
    startDate,
    endDate,
    importBatchId,
    page = 1,
    pageSize = 20,
    orderBy = 'transaction_date',
    orderDir = 'desc',
  } = params;

  // Build the query
  let query = supabase
    .from('transactions')
    .select('*, category:categories(*)', { count: 'exact' })
    .is('deleted_at', null);

  // Apply filters
  if (taxYear !== undefined) {
    query = query.eq('tax_year', taxYear);
  }

  if (categoryId !== undefined) {
    if (categoryId === null) {
      query = query.is('category_id', null);
    } else {
      query = query.eq('category_id', categoryId);
    }
  }

  if (transactionType !== undefined) {
    query = query.eq('transaction_type', transactionType);
  }

  if (isVerified !== undefined) {
    query = query.eq('is_verified', isVerified);
  }

  if (search !== undefined && search.length > 0) {
    query = query.ilike('description', `%${search}%`);
  }

  if (startDate !== undefined) {
    query = query.gte('transaction_date', startDate);
  }

  if (endDate !== undefined) {
    query = query.lte('transaction_date', endDate);
  }

  if (importBatchId !== undefined) {
    query = query.eq('import_batch_id', importBatchId);
  }

  // Apply ordering
  query = query.order(orderBy, { ascending: orderDir === 'asc' });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return {
      data: [],
      count: 0,
      page,
      pageSize,
      totalPages: 0,
      error: error.message,
    };
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as TransactionWithCategory[],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    error: null,
  };
}

/**
 * Get a single transaction by ID.
 */
export async function getTransaction(
  supabase: TypedSupabaseClient,
  transactionId: string
): Promise<QueryResult<TransactionWithCategory>> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('id', transactionId)
    .is('deleted_at', null)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as TransactionWithCategory, error: null };
}

/**
 * Get count of uncategorized transactions.
 */
export async function getUncategorizedCount(
  supabase: TypedSupabaseClient,
  taxYear?: number
): Promise<QueryResult<number>> {
  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .is('category_id', null)
    .is('deleted_at', null);

  if (taxYear !== undefined) {
    query = query.eq('tax_year', taxYear);
  }

  const { count, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: count ?? 0, error: null };
}

/**
 * Get transaction totals (income/expenses) for a tax year.
 */
export async function getTransactionTotals(
  supabase: TypedSupabaseClient,
  taxYear: number
): Promise<QueryResult<{ income: number; expenses: number; count: number }>> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, transaction_type')
    .eq('tax_year', taxYear)
    .is('deleted_at', null);

  if (error) {
    return { data: null, error: error.message };
  }

  let income = 0;
  let expenses = 0;

  for (const tx of data ?? []) {
    if (tx.transaction_type === 'credit') {
      income += tx.amount;
    } else {
      expenses += tx.amount;
    }
  }

  return {
    data: { income, expenses, count: data?.length ?? 0 },
    error: null,
  };
}

/**
 * Update a transaction's category.
 */
export async function updateTransactionCategory(
  supabase: TypedSupabaseClient,
  transactionId: string,
  categoryId: string | null,
  isVerified: boolean = true
): Promise<QueryResult<Transaction>> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      category_id: categoryId,
      is_verified: isVerified,
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Get available tax years (years that have transactions).
 */
export async function getAvailableTaxYears(
  supabase: TypedSupabaseClient
): Promise<QueryListResult<number>> {
  const { data, error } = await supabase
    .from('transactions')
    .select('tax_year')
    .is('deleted_at', null);

  if (error) {
    return { data: [], error: error.message };
  }

  // Get unique years, sorted descending
  const years = [...new Set((data ?? []).map((t) => t.tax_year))];
  years.sort((a, b) => b - a);

  // If no transactions, return current year
  if (years.length === 0) {
    years.push(new Date().getFullYear());
  }

  return { data: years, error: null };
}

// ============================================================
// TAX CALCULATION QUERIES
// ============================================================

/**
 * Get tax calculations for a user.
 */
export async function getTaxCalculations(
  supabase: TypedSupabaseClient,
  params: {
    taxYear?: number;
    taxType?: 'pit' | 'cit' | 'vat' | 'wht';
    limit?: number;
  } = {}
): Promise<QueryListResult<TaxCalculation>> {
  const { taxYear, taxType, limit = 50 } = params;

  let query = supabase
    .from('tax_calculations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (taxYear !== undefined) {
    query = query.eq('tax_year', taxYear);
  }

  if (taxType !== undefined) {
    query = query.eq('tax_type', taxType);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

/**
 * Get the latest tax calculation for a specific type and year.
 */
export async function getLatestTaxCalculation(
  supabase: TypedSupabaseClient,
  taxType: 'pit' | 'cit' | 'vat' | 'wht',
  taxYear: number
): Promise<QueryResult<TaxCalculation>> {
  const { data, error } = await supabase
    .from('tax_calculations')
    .select('*')
    .eq('tax_type', taxType)
    .eq('tax_year', taxYear)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// ============================================================
// IMPORT BATCH QUERIES
// ============================================================

/**
 * Get import batches.
 */
export async function getImportBatches(
  supabase: TypedSupabaseClient,
  params: {
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
    limit?: number;
  } = {}
): Promise<QueryListResult<ImportBatch>> {
  const { status, limit = 20 } = params;

  let query = supabase
    .from('import_batches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status !== undefined) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

/**
 * Get a single import batch by ID.
 */
export async function getImportBatch(
  supabase: TypedSupabaseClient,
  batchId: string
): Promise<QueryResult<ImportBatch>> {
  const { data, error } = await supabase
    .from('import_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// ============================================================
// DASHBOARD QUERIES
// ============================================================

/**
 * Get dashboard summary data.
 *
 * @example
 * const { data: summary } = await getDashboardSummary(supabase, 2024);
 */
export async function getDashboardSummary(
  supabase: TypedSupabaseClient,
  taxYear: number
): Promise<QueryResult<{
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
  uncategorizedCount: number;
  recentTransactions: TransactionWithCategory[];
}>> {
  // Run queries in parallel
  const [totalsResult, uncategorizedResult, recentResult] = await Promise.all([
    getTransactionTotals(supabase, taxYear),
    getUncategorizedCount(supabase, taxYear),
    getTransactions(supabase, { taxYear, pageSize: 5, orderBy: 'transaction_date', orderDir: 'desc' }),
  ]);

  // Check for errors
  if (totalsResult.error) {
    return { data: null, error: totalsResult.error };
  }
  if (uncategorizedResult.error) {
    return { data: null, error: uncategorizedResult.error };
  }
  if (recentResult.error) {
    return { data: null, error: recentResult.error };
  }

  return {
    data: {
      totalIncome: totalsResult.data?.income ?? 0,
      totalExpenses: totalsResult.data?.expenses ?? 0,
      transactionCount: totalsResult.data?.count ?? 0,
      uncategorizedCount: uncategorizedResult.data ?? 0,
      recentTransactions: recentResult.data,
    },
    error: null,
  };
}
