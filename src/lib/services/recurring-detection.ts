/**
 * Recurring Transaction Detection
 * Identifies payment patterns from Convex transactions (in-memory; no persist table).
 */

export interface RecurringPattern {
  merchantNormalized: string;
  intervalDays: number;
  amountMean: number;
  amountStddev: number;
  confidence: number;
  lastOccurrenceDate: string;
  nextExpectedDate: string;
  occurrenceCount: number;
}

interface DetectableTransaction {
  merchant: string;
  amount: number;
  date: string;
}

function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function detectRecurringPatternsFromTransactions(
  transactions: DetectableTransaction[],
): RecurringPattern[] {
  const merchantGroups: Record<string, DetectableTransaction[]> = {};
  for (const txn of transactions) {
    const normalized = normalizeMerchant(txn.merchant);
    if (!normalized) continue;
    if (!merchantGroups[normalized]) merchantGroups[normalized] = [];
    merchantGroups[normalized].push(txn);
  }

  const patterns: RecurringPattern[] = [];
  for (const [merchantNorm, txns] of Object.entries(merchantGroups)) {
    if (txns.length < 3) continue;
    txns.sort((a, b) => a.date.localeCompare(b.date));
    const intervals: number[] = [];
    for (let i = 1; i < txns.length; i++) {
      intervals.push(
        daysBetween(new Date(txns[i - 1]!.date), new Date(txns[i]!.date)),
      );
    }
    const meanInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (meanInterval <= 0) continue;
    const variance =
      intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - meanInterval, 2);
      }, 0) / intervals.length;
    const stddevInterval = Math.sqrt(variance);
    const cv = stddevInterval / meanInterval;
    if (cv >= 0.2) continue;

    const amounts = txns.map((t) => t.amount);
    const meanAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariance =
      amounts.reduce((sum, amount) => {
        return sum + Math.pow(amount - meanAmount, 2);
      }, 0) / amounts.length;
    const stddevAmount = Math.sqrt(amountVariance);
    const frequencyScore = 1 - cv;
    const sampleScore = Math.min(txns.length / 12, 1);
    const amountCV = meanAmount === 0 ? 0 : stddevAmount / meanAmount;
    const amountScore = Math.max(0, 1 - amountCV);
    const confidence =
      frequencyScore * 0.5 + sampleScore * 0.3 + amountScore * 0.2;
    if (confidence < 0.7) continue;

    const lastTxn = txns[txns.length - 1]!;
    const lastDate = new Date(lastTxn.date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + Math.round(meanInterval));
    patterns.push({
      merchantNormalized: merchantNorm,
      intervalDays: Math.round(meanInterval),
      amountMean: meanAmount,
      amountStddev: stddevAmount,
      confidence: Math.round(confidence * 100) / 100,
      lastOccurrenceDate: lastDate.toISOString().split("T")[0]!,
      nextExpectedDate: nextDate.toISOString().split("T")[0]!,
      occurrenceCount: txns.length,
    });
  }
  return patterns;
}
