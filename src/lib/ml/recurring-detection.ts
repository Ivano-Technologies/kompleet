/**
 * Recurring Transaction Detection
 * Identifies payment patterns and recurring transactions
 */

import { createClient } from '@/lib/supabase/server';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  userId: string;
}

interface RecurringPattern {
  merchantNormalized: string;
  intervalDays: number;
  amountMean: number;
  amountStddev: number;
  confidence: number;
  lastOccurrenceDate: string;
  nextExpectedDate: string;
  occurrenceCount: number;
}

/**
 * Normalize merchant name for pattern matching
 */
function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Calculate days between dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Detect recurring patterns in user's transactions
 */
export async function detectRecurringPatterns(userId: string): Promise<RecurringPattern[]> {
  const supabase = await createClient();
  
  // Fetch user's transactions from last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, merchant, amount, date')
    .eq('user_id', userId)
    .gte('date', twelveMonthsAgo.toISOString())
    .order('date', { ascending: true });
  
  if (error || !transactions) {
    console.error('[Recurring Detection Error]', error);
    return [];
  }
  
  // Group transactions by normalized merchant
  const merchantGroups: Record<string, Transaction[]> = {};
  
  for (const txn of transactions) {
    const normalized = normalizeMerchant(txn.merchant);
    if (!merchantGroups[normalized]) {
      merchantGroups[normalized] = [];
    }
    merchantGroups[normalized].push({
      ...txn,
      userId
    });
  }
  
  // Analyze each merchant group for patterns
  const patterns: RecurringPattern[] = [];
  
  for (const [merchantNorm, txns] of Object.entries(merchantGroups)) {
    // Need at least 3 transactions to detect pattern
    if (txns.length < 3) {
      continue;
    }
    
    // Calculate intervals between transactions
    const intervals: number[] = [];
    for (let i = 1; i < txns.length; i++) {
      const days = daysBetween(
        new Date(txns[i-1].date),
        new Date(txns[i].date)
      );
      intervals.push(days);
    }
    
    // Calculate mean and standard deviation of intervals
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - meanInterval, 2);
    }, 0) / intervals.length;
    const stddevInterval = Math.sqrt(variance);
    
    // Calculate coefficient of variation (CV)
    const cv = stddevInterval / meanInterval;
    
    // Pattern is recurring if CV < 0.2 (20% variation)
    if (cv < 0.2) {
      // Calculate amount statistics
      const amounts = txns.map(t => t.amount);
      const meanAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const amountVariance = amounts.reduce((sum, amount) => {
        return sum + Math.pow(amount - meanAmount, 2);
      }, 0) / amounts.length;
      const stddevAmount = Math.sqrt(amountVariance);
      
      // Calculate confidence score
      // Factors: frequency consistency (1 - CV), sample size, amount consistency
      const frequencyScore = 1 - cv;
      const sampleScore = Math.min(txns.length / 12, 1); // Max at 12 occurrences
      const amountCV = stddevAmount / meanAmount;
      const amountScore = Math.max(0, 1 - amountCV);
      
      const confidence = (frequencyScore * 0.5) + (sampleScore * 0.3) + (amountScore * 0.2);
      
      // Only include patterns with confidence > 0.7
      if (confidence >= 0.7) {
        const lastTxn = txns[txns.length - 1];
        const lastDate = new Date(lastTxn.date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + Math.round(meanInterval));
        
        patterns.push({
          merchantNormalized: merchantNorm,
          intervalDays: Math.round(meanInterval),
          amountMean: meanAmount,
          amountStddev: stddevAmount,
          confidence: Math.round(confidence * 100) / 100,
          lastOccurrenceDate: lastDate.toISOString().split('T')[0],
          nextExpectedDate: nextDate.toISOString().split('T')[0],
          occurrenceCount: txns.length
        });
      }
    }
  }
  
  return patterns;
}

/**
 * Save detected patterns to database
 */
export async function saveRecurringPatterns(
  userId: string,
  patterns: RecurringPattern[]
) {
  const supabase = await createClient();
  
  // Delete existing patterns for user
  await supabase
    .from('recurring_patterns')
    .delete()
    .eq('user_id', userId);
  
  // Insert new patterns
  if (patterns.length > 0) {
    const { error } = await supabase
      .from('recurring_patterns')
      .insert(
        patterns.map(p => ({
          user_id: userId,
          merchant_normalized: p.merchantNormalized,
          interval_days: p.intervalDays,
          amount_mean: p.amountMean,
          amount_stddev: p.amountStddev,
          confidence: p.confidence,
          last_occurrence_date: p.lastOccurrenceDate,
          next_expected_date: p.nextExpectedDate,
          occurrence_count: p.occurrenceCount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      );
    
    if (error) {
      console.error('[Save Recurring Patterns Error]', error);
      throw error;
    }
  }
  
  return patterns.length;
}

/**
 * Get recurring patterns for user
 */
export async function getRecurringPatterns(userId: string) {
  const supabase = await createClient();
  
  const { data: patterns, error } = await supabase
    .from('recurring_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence', 0.7)
    .order('confidence', { ascending: false });
  
  if (error) {
    console.error('[Get Recurring Patterns Error]', error);
    return [];
  }
  
  return patterns || [];
}

/**
 * Check if a transaction matches a recurring pattern
 */
export async function checkRecurringMatch(
  userId: string,
  merchant: string,
  amount: number,
  date: string
): Promise<{
  isRecurring: boolean;
  pattern?: RecurringPattern;
  confidence?: number;
} | null> {
  const patterns = await getRecurringPatterns(userId);
  const merchantNorm = normalizeMerchant(merchant);
  
  for (const pattern of patterns) {
    if (pattern.merchant_normalized === merchantNorm) {
      // Check if amount is within 2 standard deviations
      const amountDiff = Math.abs(amount - pattern.amount_mean);
      const amountThreshold = pattern.amount_stddev * 2;
      
      if (amountDiff <= amountThreshold) {
        // Check if date is near expected date (within interval tolerance)
        const txnDate = new Date(date);
        const expectedDate = new Date(pattern.next_expected_date);
        const daysDiff = Math.abs(daysBetween(txnDate, expectedDate));
        const dateThreshold = pattern.interval_days * 0.2; // 20% tolerance
        
        if (daysDiff <= dateThreshold) {
          return {
            isRecurring: true,
            pattern: {
              merchantNormalized: pattern.merchant_normalized,
              intervalDays: pattern.interval_days,
              amountMean: pattern.amount_mean,
              amountStddev: pattern.amount_stddev,
              confidence: pattern.confidence,
              lastOccurrenceDate: pattern.last_occurrence_date,
              nextExpectedDate: pattern.next_expected_date,
              occurrenceCount: pattern.occurrence_count
            },
            confidence: pattern.confidence
          };
        }
      }
    }
  }
  
  return {
    isRecurring: false
  };
}

/**
 * Run recurring detection for all users (scheduled job)
 */
export async function runRecurringDetectionForAllUsers() {
  const supabase = await createClient();
  
  // Get all users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id');
  
  if (error || !users) {
    console.error('[Recurring Detection All Users Error]', error);
    return;
  }
  
  console.log(`[Recurring Detection] Processing ${users.length} users...`);
  
  let processed = 0;
  let totalPatterns = 0;
  
  for (const user of users) {
    try {
      const patterns = await detectRecurringPatterns(user.id);
      const saved = await saveRecurringPatterns(user.id, patterns);
      totalPatterns += saved;
      processed++;
      
      if (processed % 100 === 0) {
        console.log(`[Recurring Detection] Processed ${processed}/${users.length} users`);
      }
    } catch (error) {
      console.error(`[Recurring Detection] Error for user ${user.id}:`, error);
    }
  }
  
  console.log(`[Recurring Detection] Complete: ${processed} users, ${totalPatterns} patterns`);
}
