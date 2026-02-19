/**
 * Bank Detection Module
 * ======================
 * Automatically detects the bank from CSV/Excel file contents
 * by analyzing headers, patterns, and file structure.
 */

import { BANK_CONFIGS, BankConfig } from './bank-configs';
import Papa from 'papaparse';

export interface BankDetectionResult {
  bankCode: string | null;
  confidence: number; // 0-100
  matchedFeatures: string[];
}

/**
 * Bank-specific detection patterns
 * These patterns help identify the bank based on file content
 */
const BANK_PATTERNS: Record<string, {
  headers: string[];
  contentPatterns: RegExp[];
  fileNamePatterns: RegExp[];
}> = {
  GTB: {
    headers: ['Date', 'Transaction Details', 'Debit', 'Credit', 'Balance'],
    contentPatterns: [/GTBank/i, /Guaranty Trust/i],
    fileNamePatterns: [/gtb/i, /gtbank/i, /guaranty.*trust/i],
  },
  ZEN: {
    headers: ['Tran Date', 'Narration', 'Debit', 'Credit', 'Balance', 'Ref'],
    contentPatterns: [/Zenith Bank/i],
    fileNamePatterns: [/zenith/i, /zen/i],
  },
  ACC: {
    headers: ['Transaction Date', 'Description', 'Debit', 'Credit', 'Balance', 'Reference'],
    contentPatterns: [/Access Bank/i],
    fileNamePatterns: [/access/i, /acc/i],
  },
  FBN: {
    headers: ['Date', 'Narration', 'Debit', 'Credit', 'Balance', 'Ref No'],
    contentPatterns: [/First Bank/i, /FirstBank/i, /FBN/],
    fileNamePatterns: [/firstbank/i, /first.*bank/i, /fbn/i],
  },
  UBA: {
    headers: ['Transaction Date', 'Transaction Details', 'Debit', 'Credit', 'Balance', 'Reference'],
    contentPatterns: [/United Bank.*Africa/i, /UBA/],
    fileNamePatterns: [/uba/i, /united.*bank/i],
  },
  ECO: {
    headers: ['Date', 'Description', 'Debit', 'Credit', 'Balance', 'Ref'],
    contentPatterns: [/Ecobank/i],
    fileNamePatterns: [/ecobank/i, /eco/i],
  },
  SBT: {
    headers: ['Transaction Date', 'Narration', 'Debit', 'Credit', 'Balance', 'Reference'],
    contentPatterns: [/Stanbic.*IBTC/i, /Stanbic/i],
    fileNamePatterns: [/stanbic/i, /sbt/i, /ibtc/i],
  },
  FID: {
    headers: ['Date', 'Description', 'Debit', 'Credit', 'Balance', 'Reference Number'],
    contentPatterns: [/Fidelity Bank/i],
    fileNamePatterns: [/fidelity/i, /fid/i],
  },
  UNB: {
    headers: ['Transaction Date', 'Narration', 'Debit', 'Credit', 'Balance', 'Ref'],
    contentPatterns: [/Union Bank/i],
    fileNamePatterns: [/union.*bank/i, /unb/i],
  },
  MON: {
    headers: ['Date', 'Narration', 'Debit', 'Credit', 'Balance', 'Reference'],
    contentPatterns: [/Moniepoint/i, /TeamApt/i],
    fileNamePatterns: [/moniepoint/i, /monie/i, /teamapt/i],
  },
  WEM: {
    headers: ['Date', 'Details', 'Debit', 'Credit', 'Balance'],
    contentPatterns: [/Wema Bank/i],
    fileNamePatterns: [/wema/i, /wem/i],
  },
};

/**
 * Detect bank from CSV file buffer
 */
export async function detectBankFromCSV(
  fileBuffer: Buffer,
  fileName?: string
): Promise<BankDetectionResult> {
  try {
    const fileContent = fileBuffer.toString('utf-8');
    
    // Parse CSV to get headers and first few rows
    const parsed = Papa.parse(fileContent, {
      preview: 10, // Only parse first 10 rows for detection
      skipEmptyLines: true,
    });

    if (!parsed.data || parsed.data.length === 0) {
      return { bankCode: null, confidence: 0, matchedFeatures: [] };
    }

    const headers = parsed.data[0] as string[];
    const rows = parsed.data.slice(1);

    // Try to match against each bank's patterns
    const scores: Record<string, { score: number; features: string[] }> = {};

    for (const [bankCode, patterns] of Object.entries(BANK_PATTERNS)) {
      let score = 0;
      const features: string[] = [];

      // Check header match (most reliable indicator)
      const headerMatch = calculateHeaderMatch(headers, patterns.headers);
      score += headerMatch * 50; // Headers are worth 50 points
      if (headerMatch > 0.7) {
        features.push(`Headers match (${Math.round(headerMatch * 100)}%)`);
      }

      // Check content patterns
      const contentStr = rows.slice(0, 5).flat().join(' ');
      for (const pattern of patterns.contentPatterns) {
        if (pattern.test(contentStr)) {
          score += 20; // Content pattern match is worth 20 points
          features.push(`Content pattern: ${pattern.source}`);
        }
      }

      // Check filename patterns
      if (fileName) {
        for (const pattern of patterns.fileNamePatterns) {
          if (pattern.test(fileName)) {
            score += 10; // Filename match is worth 10 points
            features.push(`Filename pattern: ${pattern.source}`);
          }
        }
      }

      scores[bankCode] = { score, features };
    }

    // Find the bank with the highest score
    let bestBank: string | null = null;
    let bestScore = 0;
    let bestFeatures: string[] = [];

    for (const [bankCode, { score, features }] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestBank = bankCode;
        bestFeatures = features;
      }
    }

    // Only return a result if confidence is above threshold (70%)
    const confidence = Math.min(bestScore, 100);
    if (confidence < 70) {
      return { bankCode: null, confidence, matchedFeatures: bestFeatures };
    }

    return {
      bankCode: bestBank,
      confidence,
      matchedFeatures: bestFeatures,
    };
  } catch (error) {
    console.error('Error detecting bank from CSV:', error);
    return { bankCode: null, confidence: 0, matchedFeatures: [] };
  }
}

/**
 * Calculate how well the file headers match the expected bank headers
 * Returns a score between 0 and 1
 */
function calculateHeaderMatch(fileHeaders: string[], expectedHeaders: string[]): number {
  if (!fileHeaders || fileHeaders.length === 0) return 0;

  // Normalize headers (trim, lowercase)
  const normalizedFileHeaders = fileHeaders.map(h => 
    h?.toString().trim().toLowerCase() || ''
  );
  const normalizedExpectedHeaders = expectedHeaders.map(h => 
    h.trim().toLowerCase()
  );

  // Count how many expected headers are present in the file
  let matches = 0;
  for (const expected of normalizedExpectedHeaders) {
    if (normalizedFileHeaders.some(file => file === expected || file.includes(expected))) {
      matches++;
    }
  }

  // Return the ratio of matched headers
  return matches / normalizedExpectedHeaders.length;
}

/**
 * Detect bank from Excel file buffer
 * (Similar logic to CSV, but for Excel files)
 */
export async function detectBankFromExcel(
  fileBuffer: Buffer,
  fileName?: string
): Promise<BankDetectionResult> {
  // For now, we'll use filename-based detection for Excel files
  // In the future, we can parse Excel files and analyze their structure
  
  if (!fileName) {
    return { bankCode: null, confidence: 0, matchedFeatures: [] };
  }

  for (const [bankCode, patterns] of Object.entries(BANK_PATTERNS)) {
    for (const pattern of patterns.fileNamePatterns) {
      if (pattern.test(fileName)) {
        return {
          bankCode,
          confidence: 60, // Lower confidence for filename-only detection
          matchedFeatures: [`Filename pattern: ${pattern.source}`],
        };
      }
    }
  }

  return { bankCode: null, confidence: 0, matchedFeatures: [] };
}

/**
 * Detect bank from file buffer (auto-detects file type)
 */
export async function detectBank(
  fileBuffer: Buffer,
  fileName?: string
): Promise<BankDetectionResult> {
  // Determine file type from extension or content
  const isCSV = fileName?.toLowerCase().endsWith('.csv') || false;
  const isExcel = fileName?.toLowerCase().match(/\.(xlsx?|xls)$/) || false;

  if (isCSV) {
    return detectBankFromCSV(fileBuffer, fileName);
  } else if (isExcel) {
    return detectBankFromExcel(fileBuffer, fileName);
  }

  // Try CSV detection as fallback
  return detectBankFromCSV(fileBuffer, fileName);
}
