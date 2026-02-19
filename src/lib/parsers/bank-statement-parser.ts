/**
 * Bank Statement Parser Service
 * Supports CSV and Excel formats from major Nigerian banks
 */

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
  reference?: string;
}

export interface BankConfig {
  name: string;
  dateColumn: string | number;
  descriptionColumn: string | number;
  debitColumn?: string | number;
  creditColumn?: string | number;
  amountColumn?: string | number;
  balanceColumn?: string | number;
  referenceColumn?: string | number;
  dateFormat: string;
  skipRows?: number;
}

// Bank-specific configurations
export const BANK_CONFIGS: Record<string, BankConfig> = {
  gtbank: {
    name: 'GTBank',
    dateColumn: 'Date',
    descriptionColumn: 'Narration',
    debitColumn: 'Debit',
    creditColumn: 'Credit',
    balanceColumn: 'Balance',
    referenceColumn: 'Reference',
    dateFormat: 'DD/MM/YYYY',
    skipRows: 1,
  },
  zenith: {
    name: 'Zenith Bank',
    dateColumn: 'Trans Date',
    descriptionColumn: 'Narration',
    debitColumn: 'Debit',
    creditColumn: 'Credit',
    balanceColumn: 'Balance',
    referenceColumn: 'Reference No',
    dateFormat: 'DD-MMM-YYYY',
    skipRows: 1,
  },
  access: {
    name: 'Access Bank',
    dateColumn: 'Transaction Date',
    descriptionColumn: 'Description',
    debitColumn: 'Debit',
    creditColumn: 'Credit',
    balanceColumn: 'Balance',
    referenceColumn: 'Reference',
    dateFormat: 'DD/MM/YYYY',
    skipRows: 1,
  },
  firstbank: {
    name: 'First Bank',
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    debitColumn: 'Debit',
    creditColumn: 'Credit',
    balanceColumn: 'Balance',
    referenceColumn: 'Ref',
    dateFormat: 'DD/MM/YYYY',
    skipRows: 1,
  },
  uba: {
    name: 'UBA',
    dateColumn: 'Date',
    descriptionColumn: 'Narration',
    debitColumn: 'Debit',
    creditColumn: 'Credit',
    balanceColumn: 'Balance',
    referenceColumn: 'Reference',
    dateFormat: 'DD/MM/YYYY',
    skipRows: 1,
  },
  generic: {
    name: 'Generic',
    dateColumn: 0, // First column
    descriptionColumn: 1, // Second column
    amountColumn: 2, // Third column (positive = credit, negative = debit)
    balanceColumn: 3, // Fourth column
    dateFormat: 'YYYY-MM-DD',
    skipRows: 1,
  },
};

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string, format: string): Date {
  // Remove extra whitespace
  dateStr = dateStr.trim();
  
  // Handle different date formats
  if (format === 'DD/MM/YYYY') {
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (format === 'DD-MMM-YYYY') {
    // e.g., "05-FEB-2026"
    const [day, monthStr, year] = dateStr.split('-');
    const months: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };
    const month = months[monthStr.toUpperCase()];
    return new Date(parseInt(year), month, parseInt(day));
  } else if (format === 'YYYY-MM-DD') {
    return new Date(dateStr);
  }
  
  // Fallback: try to parse as ISO date
  return new Date(dateStr);
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') return 0;
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = amountStr
    .replace(/[₦$,\s]/g, '')
    .replace(/\(/g, '-') // Handle negative amounts in parentheses
    .replace(/\)/g, '');
  
  return parseFloat(cleaned) || 0;
}

/**
 * Get value from row by column identifier (string name or number index)
 */
function getColumnValue(row: any, column: string | number | undefined): string {
  if (column === undefined) return '';
  
  if (typeof column === 'number') {
    // Column is an index
    if (Array.isArray(row)) {
      return row[column]?.toString() || '';
    }
    // If row is object, get by index
    const values = Object.values(row);
    return values[column]?.toString() || '';
  } else {
    // Column is a name
    return row[column]?.toString() || '';
  }
}

/**
 * Parse CSV data with bank-specific configuration
 */
export function parseCSV(
  csvData: string,
  bankType: keyof typeof BANK_CONFIGS = 'generic'
): ParsedTransaction[] {
  const config = BANK_CONFIGS[bankType];
  const lines = csvData.split('\n').filter(line => line.trim());
  
  // Skip header rows
  const dataLines = lines.slice(config.skipRows || 0);
  
  const transactions: ParsedTransaction[] = [];
  
  for (const line of dataLines) {
    // Parse CSV line (handle quoted fields)
    const fields = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const cleanFields = fields.map(f => f.replace(/^"|"$/g, '').trim());
    
    if (cleanFields.length < 3) continue; // Skip invalid rows
    
    try {
      const dateStr = getColumnValue(cleanFields, config.dateColumn);
      const description = getColumnValue(cleanFields, config.descriptionColumn);
      const debitStr = getColumnValue(cleanFields, config.debitColumn);
      const creditStr = getColumnValue(cleanFields, config.creditColumn);
      const balanceStr = getColumnValue(cleanFields, config.balanceColumn);
      const reference = getColumnValue(cleanFields, config.referenceColumn);
      
      const date = parseDate(dateStr, config.dateFormat);
      const debit = parseAmount(debitStr);
      const credit = parseAmount(creditStr);
      const balance = parseAmount(balanceStr);
      
      // Determine transaction type and amount
      let amount: number;
      let type: 'debit' | 'credit';
      
      if (config.amountColumn !== undefined) {
        // Generic format: single amount column
        const amountStr = getColumnValue(cleanFields, config.amountColumn);
        amount = parseAmount(amountStr);
        type = amount >= 0 ? 'credit' : 'debit';
        amount = Math.abs(amount);
      } else {
        // Separate debit/credit columns
        if (credit > 0) {
          amount = credit;
          type = 'credit';
        } else {
          amount = debit;
          type = 'debit';
        }
      }
      
      if (amount > 0 && description) {
        transactions.push({
          date,
          description,
          amount,
          type,
          balance: balance > 0 ? balance : undefined,
          reference: reference || undefined,
        });
      }
    } catch (error) {
      console.error('Error parsing line:', line, error);
      // Skip invalid lines
      continue;
    }
  }
  
  return transactions;
}

/**
 * Parse Excel data (array of objects)
 */
export function parseExcel(
  rows: any[],
  bankType: keyof typeof BANK_CONFIGS = 'generic'
): ParsedTransaction[] {
  const config = BANK_CONFIGS[bankType];
  const transactions: ParsedTransaction[] = [];
  
  // Skip header rows
  const dataRows = rows.slice(config.skipRows || 0);
  
  for (const row of dataRows) {
    try {
      const dateStr = getColumnValue(row, config.dateColumn);
      const description = getColumnValue(row, config.descriptionColumn);
      const debitStr = getColumnValue(row, config.debitColumn);
      const creditStr = getColumnValue(row, config.creditColumn);
      const balanceStr = getColumnValue(row, config.balanceColumn);
      const reference = getColumnValue(row, config.referenceColumn);
      
      const date = parseDate(dateStr, config.dateFormat);
      const debit = parseAmount(debitStr);
      const credit = parseAmount(creditStr);
      const balance = parseAmount(balanceStr);
      
      // Determine transaction type and amount
      let amount: number;
      let type: 'debit' | 'credit';
      
      if (config.amountColumn !== undefined) {
        const amountStr = getColumnValue(row, config.amountColumn);
        amount = parseAmount(amountStr);
        type = amount >= 0 ? 'credit' : 'debit';
        amount = Math.abs(amount);
      } else {
        if (credit > 0) {
          amount = credit;
          type = 'credit';
        } else {
          amount = debit;
          type = 'debit';
        }
      }
      
      if (amount > 0 && description) {
        transactions.push({
          date,
          description,
          amount,
          type,
          balance: balance > 0 ? balance : undefined,
          reference: reference || undefined,
        });
      }
    } catch (error) {
      console.error('Error parsing row:', row, error);
      continue;
    }
  }
  
  return transactions;
}

/**
 * Detect bank type from CSV content
 */
/**
 * Detect bank type from CSV data
 * @deprecated Use detectBankFromCSV from bank-detector.ts for more robust detection
 */
export function detectBankType(csvData: string): keyof typeof BANK_CONFIGS {
  const firstLine = csvData.split('\n')[0].toLowerCase();
  
  if (firstLine.includes('gtbank') || firstLine.includes('guaranty trust')) {
    return 'gtbank';
  } else if (firstLine.includes('zenith')) {
    return 'zenith';
  } else if (firstLine.includes('access')) {
    return 'access';
  } else if (firstLine.includes('first bank') || firstLine.includes('firstbank')) {
    return 'firstbank';
  } else if (firstLine.includes('uba') || firstLine.includes('united bank')) {
    return 'uba';
  } else if (firstLine.includes('moniepoint') || firstLine.includes('teamapt')) {
    return 'moniepoint';
  }
  
  return 'generic';
}

/**
 * Remove duplicate transactions based on date, description, and amount
 */
export function removeDuplicates(transactions: ParsedTransaction[]): ParsedTransaction[] {
  const seen = new Set<string>();
  const unique: ParsedTransaction[] = [];
  
  for (const transaction of transactions) {
    const key = `${transaction.date.toISOString()}-${transaction.description}-${transaction.amount}-${transaction.type}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(transaction);
    }
  }
  
  return unique;
}
