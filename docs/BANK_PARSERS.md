# KOMPLEET Platform - Bank Parser Documentation

## Overview

The KOMPLEET platform supports automatic parsing and import of bank statements from multiple Nigerian banks. This document explains how the bank parser system works and how to add support for new banks.

---

## Supported Banks

The platform currently supports the following Nigerian banks:

| Bank Code | Bank Name | CSV Support | Excel Support | Auto-Detection |
|---|---|---|---|---|
| GTB | GTBank (Guaranty Trust Bank) | ✅ | ✅ | ✅ |
| ZEN | Zenith Bank | ✅ | ✅ | ✅ |
| ACC | Access Bank | ✅ | ✅ | ✅ |
| FBN | First Bank of Nigeria | ✅ | ✅ | ✅ |
| UBA | United Bank for Africa | ✅ | ✅ | ✅ |
| ECO | Ecobank | ✅ | ✅ | ✅ |
| SBT | Stanbic IBTC | ✅ | ✅ | ✅ |
| FID | Fidelity Bank | ✅ | ✅ | ✅ |
| UNB | Union Bank | ✅ | ✅ | ✅ |
| **MON** | **Moniepoint** | ✅ | ✅ | ✅ |
| WEM | Wema Bank | ✅ | ✅ | ✅ |

---

## Automatic Bank Detection

The platform includes a sophisticated bank detection system that can automatically identify the bank from a CSV or Excel file without user input.

### Detection Methods

The bank detector uses multiple signals to identify the bank:

1.  **Header Matching** (50 points): Compares the file headers against known bank header patterns
2.  **Content Patterns** (20 points): Searches for bank-specific keywords in the transaction data
3.  **Filename Patterns** (10 points): Analyzes the filename for bank-related keywords

A bank is only identified if the total confidence score is **70% or higher**.

### Example Usage

```typescript
import { detectBank } from '@/lib/transaction-import/bank-detector';

const fileBuffer = await file.arrayBuffer();
const buffer = Buffer.from(fileBuffer);

const result = await detectBank(buffer, file.name);

if (result.bankCode && result.confidence >= 70) {
  console.log(`Detected: ${result.bankCode} (${result.confidence}% confidence)`);
  console.log(`Matched features: ${result.matchedFeatures.join(', ')}`);
} else {
  console.log('Could not detect bank automatically');
}
```

---

## Bank Configuration Format

Each bank has a configuration that defines how to parse its CSV and Excel files.

### CSV Configuration

```typescript
csvConfig: {
  delimiter: ',',           // CSV delimiter (usually comma)
  encoding: 'utf-8',        // File encoding
  dateColumn: 'Date',       // Name of the date column
  merchantColumn: 'Narration', // Name of the description column
  debitColumn: 'Debit',     // Name of the debit column
  creditColumn: 'Credit',   // Name of the credit column
  balanceColumn: 'Balance', // Name of the balance column (optional)
  referenceColumn: 'Reference', // Name of the reference column (optional)
  dateFormat: 'DD/MM/YYYY', // Date format used in the file
  skipRows: 0,              // Number of rows to skip at the beginning
  hasHeader: true,          // Whether the first row contains headers
}
```

### Excel Configuration

```typescript
excelConfig: {
  sheetName: 0,             // Sheet index or name
  headerRow: 1,             // Row number of the header
  dateColumn: 'A',          // Column letter for date
  merchantColumn: 'B',      // Column letter for description
  debitColumn: 'C',         // Column letter for debit
  creditColumn: 'D',        // Column letter for credit
  balanceColumn: 'E',       // Column letter for balance
  referenceColumn: 'F',     // Column letter for reference
  dateFormat: 'DD/MM/YYYY', // Date format used in the file
}
```

---

## Adding a New Bank

To add support for a new bank, follow these steps:

### Step 1: Add Bank Configuration

Edit `src/lib/transaction-import/bank-configs.ts` and add a new entry:

```typescript
NEW: {
  code: 'NEW',
  name: 'New Bank Name',
  csvConfig: {
    // ... CSV configuration
  },
  excelConfig: {
    // ... Excel configuration
  },
}
```

### Step 2: Add Detection Patterns

Edit `src/lib/transaction-import/bank-detector.ts` and add detection patterns:

```typescript
NEW: {
  headers: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
  contentPatterns: [/New Bank/i, /NEWBANK/],
  fileNamePatterns: [/newbank/i, /new.*bank/i],
}
```

### Step 3: Create Test Fixtures

Create at least two sample CSV files in `tests/fixtures/banks/`:

-   `newbank_sample1.csv`
-   `newbank_sample2.csv`

These files should contain realistic transaction data in the bank's format.

### Step 4: Add Unit Tests

Add test cases to `src/__tests__/bank-detector.test.ts`:

```typescript
it('should detect New Bank from CSV file', async () => {
  const filePath = join(process.cwd(), 'tests/fixtures/banks/newbank_sample1.csv');
  const fileBuffer = readFileSync(filePath);
  
  const result = await detectBankFromCSV(fileBuffer, 'newbank_sample1.csv');
  
  expect(result.bankCode).toBe('NEW');
  expect(result.confidence).toBeGreaterThanOrEqual(70);
});
```

### Step 5: Test the Integration

1.  Run the unit tests: `pnpm test`
2.  Test the file upload in the UI with real bank statements
3.  Verify that transactions are parsed correctly

---

## Moniepoint Integration

Moniepoint (formerly TeamApt) is a popular payment service provider in Nigeria. The platform now fully supports Moniepoint bank statements.

### Moniepoint CSV Format

```csv
Date,Narration,Debit,Credit,Balance,Reference
15/01/2026,Transfer from John Doe,,50000.00,250000.00,MPT20260115001
16/01/2026,POS Purchase - Shoprite,15000.00,,235000.00,MPT20260116002
```

### Detection Confidence

Moniepoint files are detected with high confidence (typically 80-90%) based on:
-   Header pattern matching
-   "Moniepoint" or "TeamApt" in filename or content
-   Reference number pattern (MPT prefix)

---

## Troubleshooting

### Bank Not Detected

If a bank is not being detected automatically:

1.  Check the file format matches the expected bank format
2.  Verify the headers are correct (case-insensitive)
3.  Check if the filename contains bank-related keywords
4.  Review the detection patterns in `bank-detector.ts`

### Parsing Errors

If transactions are not parsing correctly:

1.  Verify the date format in the bank configuration
2.  Check if the column names match the configuration
3.  Ensure the CSV delimiter is correct
4.  Check for special characters or encoding issues

### Low Confidence Score

If the confidence score is below 70%:

1.  Add more specific content patterns
2.  Improve header matching patterns
3.  Add filename patterns
4.  Create more comprehensive test fixtures

---

## Best Practices

1.  **Always test with real bank statements** before deploying
2.  **Create comprehensive test fixtures** with edge cases
3.  **Document any bank-specific quirks** in the configuration
4.  **Use descriptive bank codes** (3-4 letters)
5.  **Keep detection patterns specific** to avoid false positives

---

## Future Enhancements

-   Support for PDF bank statements
-   Multi-currency transaction parsing
-   Automatic duplicate detection across uploads
-   Bank statement validation and error reporting
-   Support for more Nigerian banks (Polaris, Sterling, etc.)
