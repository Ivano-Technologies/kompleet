/**
 * Deduplication logic for transactions
 * Uses hash-based deduplication to identify and remove duplicates
 */

import crypto from "crypto";
import { Transaction } from "./types";

/**
 * Create deduplication hash for a transaction
 * Hash = SHA256(date + amount + description)
 */
export function createDeduplicationHash(transaction: Transaction): string {
  const key = `${transaction.date}|${transaction.amount}|${transaction.description.toLowerCase()}`;
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Deduplicate transactions within a batch
 * Keeps first occurrence, discards duplicates
 */
export function deduplicateTransactions(
  transactions: Transaction[],
): Transaction[] {
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
 * Split a batch against already-known dedup hashes (from Convex listMine).
 */
export function checkForDuplicatesAgainstHashes(
  transactions: Transaction[],
  existingHashes: Iterable<string>,
): { new: Transaction[]; duplicates: Transaction[] } {
  const known = new Set(existingHashes);
  return {
    new: transactions.filter(
      (tx) => !known.has(createDeduplicationHash(tx)),
    ),
    duplicates: transactions.filter((tx) =>
      known.has(createDeduplicationHash(tx)),
    ),
  };
}

/**
 * Get deduplication statistics
 */
export function getDedupStats(
  original: Transaction[],
  deduplicated: Transaction[],
): { totalBefore: number; totalAfter: number; duplicatesRemoved: number } {
  return {
    totalBefore: original.length,
    totalAfter: deduplicated.length,
    duplicatesRemoved: original.length - deduplicated.length,
  };
}
