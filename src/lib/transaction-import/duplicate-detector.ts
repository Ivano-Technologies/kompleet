/**
 * Duplicate Detection Algorithm
 * Multi-factor matching with fuzzy merchant comparison
 */

import { NormalizedTransaction } from './normalizer';

export interface DuplicateMatch {
  existingTransaction: NormalizedTransaction & { id?: string };
  newTransaction: NormalizedTransaction;
  similarityScore: number; // 0.0 to 1.0
  matchFactors: MatchFactor[];
}

export type MatchFactor = 'date' | 'amount' | 'merchant' | 'reference' | 'balance';

const SIMILARITY_THRESHOLD = 0.85; // 85% similarity required
const FUZZY_MERCHANT_THRESHOLD = 0.80; // 80% merchant name similarity

/**
 * Find duplicate transactions
 */
export function findDuplicates(
  existingTransactions: (NormalizedTransaction & { id?: string })[],
  newTransactions: NormalizedTransaction[]
): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = [];

  newTransactions.forEach((newTransaction) => {
    existingTransactions.forEach((existingTransaction) => {
      const match = compareTransactions(existingTransaction, newTransaction);

      if (match.similarityScore >= SIMILARITY_THRESHOLD) {
        duplicates.push(match);
      }
    });
  });

  return duplicates;
}

/**
 * Compare two transactions for similarity
 */
function compareTransactions(
  transaction1: NormalizedTransaction,
  transaction2: NormalizedTransaction
): DuplicateMatch {
  const matchFactors: MatchFactor[] = [];
  let score = 0;
  const weights = {
    date: 0.25,
    amount: 0.30,
    merchant: 0.25,
    reference: 0.15,
    balance: 0.05,
  };

  // Compare date (exact match)
  if (transaction1.date === transaction2.date) {
    matchFactors.push('date');
    score += weights.date;
  }

  // Compare amount (exact match)
  if (Math.abs(transaction1.amount - transaction2.amount) < 0.01) {
    matchFactors.push('amount');
    score += weights.amount;
  }

  // Compare merchant (fuzzy match)
  const merchantSimilarity = calculateStringSimilarity(
    transaction1.merchant,
    transaction2.merchant
  );

  if (merchantSimilarity >= FUZZY_MERCHANT_THRESHOLD) {
    matchFactors.push('merchant');
    score += weights.merchant * merchantSimilarity;
  }

  // Compare reference (exact match if both exist)
  if (
    transaction1.reference &&
    transaction2.reference &&
    transaction1.reference === transaction2.reference
  ) {
    matchFactors.push('reference');
    score += weights.reference;
  }

  // Compare balance (exact match)
  if (Math.abs(transaction1.balance - transaction2.balance) < 0.01) {
    matchFactors.push('balance');
    score += weights.balance;
  }

  return {
    existingTransaction: transaction1,
    newTransaction: transaction2,
    similarityScore: Math.min(score, 1.0),
    matchFactors,
  };
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str1.length][str2.length];
}

/**
 * Group duplicates by existing transaction
 */
export function groupDuplicates(duplicates: DuplicateMatch[]): Map<string, DuplicateMatch[]> {
  const groups = new Map<string, DuplicateMatch[]>();

  duplicates.forEach((duplicate) => {
    const key = `${duplicate.existingTransaction.date}_${duplicate.existingTransaction.amount}_${duplicate.existingTransaction.merchant}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(duplicate);
  });

  return groups;
}

/**
 * Filter high-confidence duplicates (> 95% similarity)
 */
export function filterHighConfidenceDuplicates(duplicates: DuplicateMatch[]): DuplicateMatch[] {
  return duplicates.filter((duplicate) => duplicate.similarityScore >= 0.95);
}

/**
 * Get duplicate statistics
 */
export function getDuplicateStats(duplicates: DuplicateMatch[]): {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  averageSimilarity: number;
} {
  const total = duplicates.length;
  const highConfidence = duplicates.filter((d) => d.similarityScore >= 0.95).length;
  const mediumConfidence = duplicates.filter(
    (d) => d.similarityScore >= 0.85 && d.similarityScore < 0.95
  ).length;
  const lowConfidence = duplicates.filter((d) => d.similarityScore < 0.85).length;

  const averageSimilarity =
    total > 0
      ? duplicates.reduce((sum, d) => sum + d.similarityScore, 0) / total
      : 0;

  return {
    total,
    highConfidence,
    mediumConfidence,
    lowConfidence,
    averageSimilarity,
  };
}
