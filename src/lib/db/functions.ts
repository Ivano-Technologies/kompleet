/**
 * Database Functions Helper
 * ==========================
 * This module provides type-safe wrappers for calling Supabase security definer functions.
 * These functions enforce least-privilege access and should be used instead of direct table access.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

type TransactionType = 'credit' | 'debit';

export interface CreateTransactionParams {
  transaction_date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  transaction_type: TransactionType;
  balance?: number;
  category_id?: string;
  source?: string;
  reference?: string;
}

export interface UpdateTransactionCategoryParams {
  transaction_id: string;
  category_id: string;
  confidence_score?: number;
}

export interface UpsertProfileParams {
  email: string;
  full_name?: string;
  phone?: string;
  entity_type?: 'individual' | 'company';
  tin?: string;
  company_name?: string;
}

export interface BulkInsertResult {
  inserted_count: number;
  failed_count: number;
  errors: Array<{
    transaction: any;
    error: string;
  }>;
}

/**
 * Create a new transaction using the security definer function
 */
export async function createTransaction(
  supabase: SupabaseClient<Database>,
  params: CreateTransactionParams
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('create_transaction', {
      p_transaction_date: params.transaction_date,
      p_amount: params.amount,
      p_description: params.description,
      p_transaction_type: params.transaction_type,
      p_balance: params.balance ?? null,
      p_category_id: params.category_id ?? null,
      p_source: params.source ?? null,
      p_reference: params.reference ?? null,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as string, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Update the category of a transaction using the security definer function
 */
export async function updateTransactionCategory(
  supabase: SupabaseClient<Database>,
  params: UpdateTransactionCategoryParams
): Promise<{ data: boolean | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('update_transaction_category', {
      p_transaction_id: params.transaction_id,
      p_category_id: params.category_id,
      p_confidence_score: params.confidence_score ?? null,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as boolean, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Get the current user's profile using the security definer function
 */
export async function getUserProfile(
  supabase: SupabaseClient<Database>
): Promise<{ data: any | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('get_user_profile');

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data?.[0] ?? null, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Create or update the current user's profile using the security definer function
 */
export async function upsertProfile(
  supabase: SupabaseClient<Database>,
  params: UpsertProfileParams
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('upsert_profile', {
      p_email: params.email,
      p_full_name: params.full_name ?? null,
      p_phone: params.phone ?? null,
      p_entity_type: params.entity_type ?? 'individual',
      p_tin: params.tin ?? null,
      p_company_name: params.company_name ?? null,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as string, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Bulk insert transactions using the security definer function
 * This is used for CSV import
 */
export async function bulkInsertTransactions(
  supabase: SupabaseClient<Database>,
  transactions: CreateTransactionParams[]
): Promise<{ data: BulkInsertResult | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('bulk_insert_transactions', {
      p_transactions: transactions as any,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { 
      data: {
        inserted_count: (data as any)[0].inserted_count,
        failed_count: (data as any)[0].failed_count,
        errors: (data as any)[0].errors,
      }, 
      error: null 
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}
