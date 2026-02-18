/**
 * Deduplication logic for transactions
 * Uses hash-based deduplication to identify and remove duplicates
 */

import crypto from 'crypto';
import { Transaction } from './types';

/**
 * Create deduplication hash for a transaction
 * Hash = SHA256(date + amount + description)
 */
export function createDeduplicationHash(transaction: Transaction): string {
  const key = `${transaction.date}|${transaction.amount}|${transaction.description.toLowerCase()}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Deduplicate transactions within a batch
 * Keeps first occurrence, discards duplicates
 */
export function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Map<string, Transaction>();

  for (const tx of transactions) {
    const hash = createDeduplicationHash(tx);

    if (!seen.has(hash)) {
      seen.set(hash, tx);
    }
    // If duplicate found, skip it (keep first occurrence)
  }

  return Array.from(seen.values());
}

/**
 * Check for duplicates against existing transactions in database
 * Returns { new, duplicates }
 */
export async function checkForDuplicatesInDb(
  transactions: Transaction[],
  userId: string,
  supabase: any
): Promise<{ new: Transaction[]; duplicates: Transaction[] }> {
  try {
    // Create hashes for all transactions
    const hashes = transactions.map(tx => createDeduplicationHash(tx));

    // Query existing transactions with same hashes
    const { data: existing, error } = await supabase
      .from('transactions')
      .select('id, dedup_hash')
      .eq('user_id', userId)
      .in('dedup_hash', hashes);

    if (error) {
      console.error('Error checking duplicates:', error);
      // If query fails, return all as new (fail open)
      return { new: transactions, duplicates: [] };
    }

    const existingHashes = new Set((existing || []).map((tx: any) => tx.dedup_hash));

    return {
      new: transactions.filter(tx => !existingHashes.has(createDeduplicationHash(tx))),
      duplicates: transactions.filter(tx => existingHashes.has(createDeduplicationHash(tx))),
    };
  } catch (error) {
    console.error('Error in checkForDuplicatesInDb:', error);
    // Fail open: return all as new
    return { new: transactions, duplicates: [] };
  }
}

/**
 * Get deduplication statistics
 */
export function getDedupStats(
  original: Transaction[],
  deduplicated: Transaction[]
): { totalBefore: number; totalAfter: number; duplicatesRemoved: number } {
  return {
    totalBefore: original.length,
    totalAfter: deduplicated.length,
    duplicatesRemoved: original.length - deduplicated.length,
  };
}
