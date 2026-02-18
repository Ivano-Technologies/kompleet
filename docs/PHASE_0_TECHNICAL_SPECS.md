# Phase 0: Technical Specifications & Implementation Strategy

**Date:** February 18, 2026  
**Status:** PLANNING  
**Audience:** Engineering team, Security review

---

## 1. FOLDER STRUCTURE & FILE ORGANIZATION

```
/src/lib/ingestion/
  ├── detectFileType.ts          # Detect file format from buffer
  ├── detectEncryption.ts        # Detect encryption on PDF, Excel, ZIP
  ├── parsePdf.ts                # PDF parser with OCR fallback
  ├── parseExcel.ts              # Excel parser with password support
  ├── parseCsv.ts                # CSV parser with encoding detection
  ├── parseZip.ts                # ZIP parser for bundled statements
  ├── normalizeTransactions.ts   # Convert raw rows to canonical schema
  ├── sanitizeForAI.ts           # Remove sensitive data before LLM
  ├── deduplicate.ts             # Deduplication by hash
  ├── validate.ts                # Transaction validation
  ├── ingestionWorker.ts         # Orchestrator (sandboxed process)
  ├── types.ts                   # Shared TypeScript interfaces
  └── __tests__/
      ├── detectFileType.test.ts
      ├── detectEncryption.test.ts
      ├── parsePdf.test.ts
      ├── parseExcel.test.ts
      ├── parseCsv.test.ts
      ├── parseZip.test.ts
      ├── normalizeTransactions.test.ts
      ├── deduplicate.test.ts
      └── integration.test.ts

/src/app/api/ingest/
  └── route.ts                   # POST /api/ingest endpoint

/src/components/upload/
  ├── UploadWidget.tsx           # Main upload UI
  ├── PasswordPrompt.tsx         # Password input modal
  ├── UploadStatus.tsx           # Progress states
  └── __tests__/
      ├── UploadWidget.test.tsx
      ├── PasswordPrompt.test.tsx
      └── UploadStatus.test.tsx

/src/app/(dashboard)/transactions/
  ├── review/
  │   └── page.tsx               # Transaction review screen
  └── __tests__/
      └── review.test.tsx

/docs/
  ├── PHASE_0_ARCHITECTURE.md    # This file
  ├── PHASE_0_TECHNICAL_SPECS.md # This file
  ├── SECURITY_CHECKLIST.md      # Security requirements
  └── INGESTION_README.md        # Contributor documentation
```

---

## 2. CANONICAL TRANSACTION SCHEMA

```typescript
// /src/lib/ingestion/types.ts

export interface Transaction {
  // Core fields (required)
  id: string;                    // UUID, generated on insert
  user_id: string;               // From auth context
  source_file_id: string;        // Reference to uploaded file
  date: string;                  // ISO 8601 format: YYYY-MM-DD
  description: string;           // Transaction narration/merchant
  amount: number;                // Absolute value (always positive)
  type: 'debit' | 'credit';      // Transaction direction
  
  // Optional fields
  currency?: string;             // ISO 4217 code (default: NGN)
  balance?: number;              // Running balance after transaction
  reference?: string;            // Bank reference number
  bank_name?: string;            // Originating bank
  
  // AI Categorization fields
  category?: string;             // Assigned category
  confidence_score?: number;     // 0.0 to 1.0
  categorization_method?: 'LLM' | 'RULE' | 'ML' | 'MANUAL';
  requires_review?: boolean;     // true if confidence < 0.65
  
  // Metadata
  raw_category?: string;         // Category from bank statement
  raw_data?: Record<string, any>; // Original parsed row
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}

export interface ParseResult {
  transactions: Transaction[];
  errors: ParseError[];
  totalRows: number;
  successfulRows: number;
  fileMetadata?: {
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'xlsx' | 'xls' | 'csv' | 'zip';
    isEncrypted: boolean;
    pageCount?: number;
    sheetName?: string;
  };
}

export interface ParseError {
  rowNumber: number;
  errorType: string;
  errorMessage: string;
  rawData?: Record<string, any>;
}

export interface IngestionRequest {
  file: File;
  password?: string;             // Optional, for encrypted files
  bankCode?: string;             // Optional, for bank-specific parsing
}

export interface IngestionResponse {
  success: boolean;
  transactionCount: number;
  errors: ParseError[];
  aiJobId?: string;              // Job ID for async categorization
  message?: string;
}

export interface SanitizedTransaction {
  date: string;
  description: string;
  amount: number;
  currency: string;
  balance?: number;
  // NO: account numbers, customer names, addresses, etc.
}
```

---

## 3. PARSER SPECIFICATIONS

### 3.1 PDF Parser (parsePdf.ts)

**Input:** Buffer (encrypted or unencrypted PDF)  
**Output:** ParseResult

**Logic:**
```typescript
async function parsePdf(buffer: Buffer, password?: string): Promise<ParseResult> {
  // 1. Detect if encrypted
  const isEncrypted = detectEncryption(buffer, 'pdf');
  
  // 2. If encrypted, decrypt with password
  let decryptedBuffer = buffer;
  if (isEncrypted && password) {
    decryptedBuffer = await decryptPdfWithPassword(buffer, password);
  }
  
  // 3. Extract text using pdfjs-dist
  const text = await extractTextFromPdf(decryptedBuffer);
  
  // 4. If text extraction fails, try OCR
  if (!text || text.length < 50) {
    const ocrText = await extractWithOCR(decryptedBuffer);
    // Use ocrText if available
  }
  
  // 5. Parse text into rows using LLM
  const rows = await parseTextWithLLM(text);
  
  // 6. Normalize rows to Transaction schema
  const transactions = normalizeTransactions(rows, 'pdf');
  
  // 7. Return ParseResult
  return { transactions, errors: [], totalRows: rows.length, successfulRows: transactions.length };
}
```

**Libraries:**
- `pdfjs-dist` - PDF text extraction
- `pdf-lib` - PDF encryption/decryption
- `tesseract.js` - OCR fallback

**Edge Cases:**
- Password-protected PDFs
- Scanned/image-based PDFs (OCR fallback)
- Multi-column layouts (LLM handles)
- Page breaks (LLM handles)

---

### 3.2 Excel Parser (parseExcel.ts)

**Input:** Buffer (encrypted or unencrypted XLSX/XLS)  
**Output:** ParseResult

**Logic:**
```typescript
async function parseExcel(buffer: Buffer, password?: string): Promise<ParseResult> {
  // 1. Detect if encrypted
  const isEncrypted = detectEncryption(buffer, 'xlsx');
  
  // 2. Read workbook (exceljs handles password)
  const workbook = new ExcelJS.Workbook();
  const options: any = { password };
  await workbook.xlsx.load(buffer);
  
  // 3. Find statement sheet (heuristic: "Statement", "Transactions", etc.)
  const sheet = findStatementSheet(workbook);
  
  // 4. Extract rows from sheet
  const rows = extractRowsFromSheet(sheet);
  
  // 5. Normalize rows to Transaction schema
  const transactions = normalizeTransactions(rows, 'xlsx');
  
  // 6. Return ParseResult
  return { transactions, errors: [], totalRows: rows.length, successfulRows: transactions.length };
}
```

**Libraries:**
- `exceljs` - Excel parsing with password support

**Edge Cases:**
- Password-protected Excel files
- Multiple sheets (auto-detect statement sheet)
- Merged cells
- Formatted dates/amounts

---

### 3.3 CSV Parser (parseCsv.ts)

**Input:** Buffer (any encoding)  
**Output:** ParseResult

**Logic:**
```typescript
async function parseCsv(buffer: Buffer): Promise<ParseResult> {
  // 1. Detect encoding
  const encoding = detectEncoding(buffer);
  
  // 2. Decode buffer to string
  const csvText = decodeBuffer(buffer, encoding);
  
  // 3. Auto-detect delimiter
  const delimiter = detectDelimiter(csvText);
  
  // 4. Parse CSV
  const rows = Papa.parse(csvText, { delimiter, header: true });
  
  // 5. Normalize rows to Transaction schema
  const transactions = normalizeTransactions(rows.data, 'csv');
  
  // 6. Return ParseResult
  return { transactions, errors: rows.errors, totalRows: rows.data.length, successfulRows: transactions.length };
}
```

**Libraries:**
- `papaparse` - CSV parsing
- `chardet` - Encoding detection
- `iconv-lite` - Character encoding conversion

**Edge Cases:**
- UTF-8 BOM markers
- Latin-1/Windows-1252 encoding
- Different delimiters (comma, semicolon, tab)
- Quoted fields with embedded delimiters

---

### 3.4 ZIP Parser (parseZip.ts)

**Input:** Buffer (encrypted or unencrypted ZIP)  
**Output:** ParseResult

**Logic:**
```typescript
async function parseZip(buffer: Buffer, password?: string): Promise<ParseResult> {
  // 1. Detect if encrypted
  const isEncrypted = detectEncryption(buffer, 'zip');
  
  // 2. Extract ZIP contents (unzipper handles password)
  const entries = await unzip(buffer, { password });
  
  // 3. Find statement files (*.pdf, *.xlsx, *.csv)
  const statementFiles = entries.filter(f => /\.(pdf|xlsx|xls|csv)$/i.test(f.name));
  
  // 4. Parse each file
  const allTransactions: Transaction[] = [];
  for (const file of statementFiles) {
    const fileBuffer = await file.buffer();
    const fileType = detectFileType(file.name);
    const result = await parse(fileBuffer, fileType, password);
    allTransactions.push(...result.transactions);
  }
  
  // 5. Deduplicate across files
  const deduplicated = deduplicateTransactions(allTransactions);
  
  // 6. Return ParseResult
  return { transactions: deduplicated, errors: [], totalRows: allTransactions.length, successfulRows: deduplicated.length };
}
```

**Libraries:**
- `unzipper` - ZIP extraction with password support

**Edge Cases:**
- Password-protected ZIP archives
- Multiple statement files in one ZIP
- Nested folders
- Mixed file types

---

## 4. ENCRYPTION DETECTION & HANDLING

### 4.1 Detection Strategy

```typescript
// /src/lib/ingestion/detectEncryption.ts

export interface EncryptionInfo {
  isEncrypted: boolean;
  encryptionType?: 'password' | 'certificate' | 'unknown';
  requiresPassword: boolean;
}

export function detectEncryption(buffer: Buffer, fileType: string): EncryptionInfo {
  switch (fileType) {
    case 'pdf':
      return detectPdfEncryption(buffer);
    case 'xlsx':
    case 'xls':
      return detectExcelEncryption(buffer);
    case 'zip':
      return detectZipEncryption(buffer);
    default:
      return { isEncrypted: false, requiresPassword: false };
  }
}

function detectPdfEncryption(buffer: Buffer): EncryptionInfo {
  // PDF encryption is indicated by /Encrypt dictionary
  const bufferStr = buffer.toString('latin1');
  const isEncrypted = bufferStr.includes('/Encrypt');
  return {
    isEncrypted,
    encryptionType: isEncrypted ? 'password' : undefined,
    requiresPassword: isEncrypted,
  };
}

function detectExcelEncryption(buffer: Buffer): EncryptionInfo {
  // XLSX is a ZIP file; check for encryption markers
  // XLS uses OLE2 format; check for encryption flags
  try {
    const isZip = buffer.slice(0, 4).toString('hex') === '504b0304'; // ZIP signature
    if (isZip) {
      // XLSX: check for encryption in ZIP central directory
      return { isEncrypted: false, requiresPassword: false }; // exceljs will handle
    } else {
      // XLS: check OLE2 encryption flags
      return { isEncrypted: false, requiresPassword: false }; // exceljs will handle
    }
  } catch {
    return { isEncrypted: false, requiresPassword: false };
  }
}

function detectZipEncryption(buffer: Buffer): EncryptionInfo {
  // ZIP encryption indicated by encryption flags in local file headers
  try {
    // Check for encryption flags (bit 0 of general purpose bit flag)
    const isEncrypted = (buffer[6] & 0x01) === 0x01;
    return {
      isEncrypted,
      encryptionType: isEncrypted ? 'password' : undefined,
      requiresPassword: isEncrypted,
    };
  } catch {
    return { isEncrypted: false, requiresPassword: false };
  }
}
```

### 4.2 Password Handling

**Security Rules:**
- ❌ Never log passwords
- ❌ Never store passwords in database
- ✅ Decrypt only in memory
- ✅ Use TLS 1.3+ for transmission
- ✅ Rate-limit password attempts (max 3)
- ✅ Clear password from memory after use

```typescript
// Password handling in API endpoint
async function handleEncryptedFile(file: File, password?: string) {
  // 1. Validate password provided
  if (!password) {
    return { error: 'PASSWORD_REQUIRED', requiresPassword: true };
  }
  
  // 2. Rate-limit attempts (store in Redis)
  const attemptCount = await redis.incr(`password_attempts:${file.name}`);
  if (attemptCount > 3) {
    return { error: 'TOO_MANY_ATTEMPTS', locked: true };
  }
  
  // 3. Try to decrypt
  try {
    const decrypted = await decrypt(file, password);
    // Clear password from memory
    password = '';
    return { success: true, decrypted };
  } catch (error) {
    // Clear password from memory
    password = '';
    return { error: 'WRONG_PASSWORD', retry: true };
  }
}
```

---

## 5. NORMALIZATION STRATEGY

### 5.1 Raw Row Format (from parsers)

```typescript
interface RawRow {
  date: string;           // Any format: DD/MM/YYYY, MM/DD/YYYY, etc.
  description: string;    // Merchant/narration
  amount: string;         // May include currency symbols, commas
  balance?: string;       // Optional running balance
  reference?: string;     // Optional transaction reference
  type?: string;          // May be 'DR', 'CR', 'DEBIT', 'CREDIT'
  [key: string]: any;     // Other fields from bank
}
```

### 5.2 Normalization Logic

```typescript
// /src/lib/ingestion/normalizeTransactions.ts

export function normalizeTransactions(rawRows: RawRow[], fileType: string): Transaction[] {
  return rawRows.map((row, index) => {
    try {
      return {
        id: generateUUID(),
        user_id: getCurrentUserId(),
        source_file_id: getCurrentSourceFileId(),
        
        // Normalize date
        date: normalizeDate(row.date),
        
        // Normalize description
        description: normalizeDescription(row.description),
        
        // Normalize amount
        amount: normalizeAmount(row.amount),
        
        // Detect type
        type: detectTransactionType(row),
        
        // Optional fields
        currency: 'NGN', // Default to Nigerian Naira
        balance: row.balance ? parseFloat(row.balance.toString().replace(/[,₦NGN\s]/g, '')) : undefined,
        reference: row.reference?.toString().trim() || undefined,
        
        // Metadata
        raw_data: row,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      // Return error, not transaction
      throw new ParseError(index, 'NORMALIZATION_ERROR', error.message);
    }
  });
}

function normalizeDate(dateStr: string): string {
  // Try multiple formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-Mon-YYYY
  // Return ISO format: YYYY-MM-DD
  // Validate: no Feb 29 on non-leap years, etc.
}

function normalizeDescription(desc: string): string {
  // Trim whitespace
  // Remove account numbers (heuristic: 10+ consecutive digits)
  // Limit to 255 characters
  // Return normalized string
}

function normalizeAmount(amountStr: string): number {
  // Remove currency symbols (₦, NGN, $, €, etc.)
  // Remove commas
  // Handle scientific notation (1.23E+09)
  // Validate: positive number, max 2 decimal places
  // Return absolute value
}

function detectTransactionType(row: RawRow): 'debit' | 'credit' {
  // Check 'type' field: DR/DEBIT → debit, CR/CREDIT → credit
  // Check amount sign: negative → debit, positive → credit
  // Check description: WITHDRAWAL/ATM → debit, DEPOSIT/TRANSFER IN → credit
  // Default: debit (conservative)
}
```

---

## 6. DEDUPLICATION STRATEGY

### 6.1 Deduplication Hash

```typescript
// /src/lib/ingestion/deduplicate.ts

function createDeduplicationHash(tx: Transaction): string {
  // Hash = SHA256(date + amount + description)
  // This identifies transactions that are identical
  
  const key = `${tx.date}|${tx.amount}|${tx.description.toLowerCase()}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Map<string, Transaction>();
  
  for (const tx of transactions) {
    const hash = createDeduplicationHash(tx);
    
    if (seen.has(hash)) {
      // Keep the first occurrence, discard duplicate
      continue;
    }
    
    seen.set(hash, tx);
  }
  
  return Array.from(seen.values());
}
```

### 6.2 Duplicate Detection (for existing transactions)

```typescript
// Check if transaction already exists in database
export async function checkForDuplicates(
  transactions: Transaction[],
  userId: string
): Promise<{ new: Transaction[], duplicates: Transaction[] }> {
  const hashes = transactions.map(tx => createDeduplicationHash(tx));
  
  // Query existing transactions with same hashes
  const existing = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .in('dedup_hash', hashes);
  
  const existingHashes = new Set(existing.data.map(tx => tx.dedup_hash));
  
  return {
    new: transactions.filter(tx => !existingHashes.has(createDeduplicationHash(tx))),
    duplicates: transactions.filter(tx => existingHashes.has(createDeduplicationHash(tx))),
  };
}
```

---

## 7. SANITIZATION FOR AI

### 7.1 Sensitive Data Removal

```typescript
// /src/lib/ingestion/sanitizeForAI.ts

export function sanitizeForAI(transaction: Transaction): SanitizedTransaction {
  // KEEP: date, description, amount, currency, balance
  // REMOVE: account numbers, customer names, addresses, statement metadata
  
  const sanitized: SanitizedTransaction = {
    date: transaction.date,
    description: sanitizeDescription(transaction.description),
    amount: transaction.amount,
    currency: transaction.currency || 'NGN',
    balance: transaction.balance,
  };
  
  return sanitized;
}

function sanitizeDescription(desc: string): string {
  // Remove account numbers (10+ consecutive digits)
  let sanitized = desc.replace(/\d{10,}/g, 'ACCOUNT_REDACTED');
  
  // Remove common PII patterns (email, phone)
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, 'EMAIL_REDACTED');
  sanitized = sanitized.replace(/\+?\d{10,}/g, 'PHONE_REDACTED');
  
  // Remove names (heuristic: capitalized words at start)
  // This is conservative to avoid over-redaction
  
  return sanitized;
}
```

---

## 8. API ENDPOINT SPECIFICATION

### POST /api/ingest

**Request:**
```typescript
{
  file: File;              // Multipart form data
  password?: string;       // Optional, for encrypted files
  bankCode?: string;       // Optional, for bank-specific parsing
}
```

**Response (Success):**
```typescript
{
  success: true,
  transactionCount: 47,
  errors: [],
  aiJobId: 'job_12345',
  message: 'Successfully ingested 47 transactions'
}
```

**Response (Encrypted, needs password):**
```typescript
{
  success: false,
  error: 'PASSWORD_REQUIRED',
  requiresPassword: true,
  message: 'This file is password-protected. Please provide the password.'
}
```

**Response (Wrong password):**
```typescript
{
  success: false,
  error: 'WRONG_PASSWORD',
  retry: true,
  attemptsRemaining: 2,
  message: 'That password didn\'t work. Try again.'
}
```

**Response (Parsing error):**
```typescript
{
  success: false,
  error: 'PARSING_ERROR',
  errors: [
    { rowNumber: 5, errorType: 'INVALID_DATE', errorMessage: 'Invalid date format' }
  ],
  message: 'Failed to parse file. See errors for details.'
}
```

---

## 9. SECURITY CHECKLIST

- [ ] No passwords logged anywhere
- [ ] No passwords stored in database
- [ ] Passwords cleared from memory after use
- [ ] HTTPS only for password transmission
- [ ] Rate-limiting on password attempts (max 3)
- [ ] Raw files deleted within 10 minutes
- [ ] No raw files sent to LLM
- [ ] Sanitization applied before AI categorization
- [ ] Audit logs do not contain sensitive data
- [ ] File upload size limited to 100MB
- [ ] MIME type validation on upload
- [ ] Worker isolation for file processing

---

## 10. TESTING STRATEGY

### Unit Tests

```typescript
// detectFileType.test.ts
- Detect PDF, XLSX, XLS, CSV, ZIP
- Reject unsupported formats

// detectEncryption.test.ts
- Detect encrypted PDF
- Detect encrypted Excel
- Detect encrypted ZIP
- Return false for unencrypted files

// parsePdf.test.ts
- Parse unencrypted PDF
- Parse encrypted PDF with correct password
- Handle wrong password gracefully
- Handle corrupted PDF
- OCR fallback for scanned PDF

// parseExcel.test.ts
- Parse XLSX file
- Parse XLS file
- Parse encrypted Excel with password
- Handle wrong password
- Auto-detect statement sheet

// parseCsv.test.ts
- Parse CSV with comma delimiter
- Parse CSV with semicolon delimiter
- Handle UTF-8 BOM
- Handle Latin-1 encoding
- Handle scientific notation

// normalizeTransactions.test.ts
- Normalize dates (DD/MM/YYYY, MM/DD/YYYY, etc.)
- Normalize amounts (remove symbols, commas)
- Detect transaction type (debit/credit)
- Validate date ranges (no Feb 29 on non-leap years)

// deduplicate.test.ts
- Deduplicate identical transactions
- Keep first occurrence
- Return unique set
```

### Integration Tests

```typescript
// integration.test.ts
- End-to-end: upload PDF → parse → normalize → deduplicate
- End-to-end: upload encrypted Excel → prompt password → parse
- End-to-end: upload ZIP with multiple files → parse all → deduplicate
- Error handling: corrupted file → graceful error
- Error handling: wrong password → retry without re-upload
```

### Security Tests

```typescript
// security.test.ts
- Verify no passwords in logs
- Verify no passwords in database
- Verify raw files deleted after parsing
- Verify no sensitive data in audit logs
- Verify password rate-limiting
```

---

**Document Status:** READY FOR REVIEW  
**Prepared by:** Manus AI  
**Date:** February 18, 2026
