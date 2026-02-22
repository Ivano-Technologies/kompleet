# API Documentation - Bank Statement Ingestion Engine

## Overview

The Bank Statement Ingestion Engine provides a complete REST API for uploading, parsing, categorizing, and managing bank transactions. All endpoints require authentication via JWT tokens.

**Base URL:** `https://techivano.com/api`  
**Authentication:** Bearer token in Authorization header  
**Rate Limit:** 100 requests per minute per user

---

## Authentication

All API endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

**Example:**

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  https://techivano.com/api/ingest
```

---

## Endpoints

### 1. File Ingestion

#### POST /api/ingest

Upload and parse a bank statement file.

**Request:**

```
Content-Type: multipart/form-data

Parameters:
- file (required): Bank statement file (PDF, Excel, CSV, ZIP)
- password (optional): Password for encrypted files
- bankCode (optional): Bank code for bank-specific parsing
```

**Response (Success):**

```json
{
  "success": true,
  "transactionCount": 42,
  "errors": [],
  "message": "Successfully ingested 42 transactions"
}
```

**Response (Password Required):**

```json
{
  "success": false,
  "message": "PASSWORD_REQUIRED",
  "requiresPassword": true
}
```

**Response (Error):**

```json
{
  "success": false,
  "transactionCount": 0,
  "errors": [
    {
      "rowNumber": 0,
      "errorType": "UNSUPPORTED_FILE_TYPE",
      "errorMessage": "File type not supported: test.doc"
    }
  ],
  "message": "Unsupported file type: test.doc"
}
```

**Status Codes:**

- `200 OK` - File processed successfully
- `400 Bad Request` - Invalid file or parameters
- `401 Unauthorized` - Authentication failed
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X POST https://techivano.com/api/ingest \
  -H "Authorization: Bearer <token>" \
  -F "file=@statement.pdf" \
  -F "bankCode=UBA"
```

---

### 2. Transaction Categorization

#### POST /api/categorize

Categorize transactions using AI.

**Request:**

```json
{
  "transactionIds": ["tx-1", "tx-2", "tx-3"],
  "useUserContext": true
}
```

**Response:**

```json
{
  "success": true,
  "predictions": [
    {
      "transactionId": "tx-1",
      "category": "Revenue",
      "confidence": 0.92,
      "reasoning": "Payment received from customer",
      "alternativeCategories": [
        {
          "category": "Sales",
          "confidence": 0.05
        }
      ]
    }
  ],
  "totalProcessed": 3,
  "successCount": 3,
  "failureCount": 0,
  "averageConfidence": 0.88,
  "message": "Successfully categorized 3 of 3 transactions"
}
```

**Status Codes:**

- `200 OK` - Categorization successful
- `400 Bad Request` - Invalid transaction IDs
- `401 Unauthorized` - Authentication failed
- `404 Not Found` - Transactions not found
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X POST https://techivano.com/api/categorize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["tx-1", "tx-2"],
    "useUserContext": true
  }'
```

---

### 3. User Feedback

#### POST /api/feedback

Record user correction for a transaction.

**Request:**

```json
{
  "transactionId": "tx-1",
  "originalCategory": "Revenue",
  "correctedCategory": "Sales",
  "originalConfidence": 0.92,
  "reason": "This is a one-time sale, not recurring revenue"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Feedback recorded successfully"
}
```

**Status Codes:**

- `200 OK` - Feedback recorded
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Authentication failed
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X POST https://techivano.com/api/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "tx-1",
    "originalCategory": "Revenue",
    "correctedCategory": "Sales",
    "originalConfidence": 0.92,
    "reason": "One-time sale"
  }'
```

#### GET /api/feedback

Get feedback statistics and category accuracy.

**Query Parameters:**

- `type` (optional): "statistics" (default) or "accuracy"

**Response (Statistics):**

```json
{
  "success": true,
  "data": {
    "totalFeedback": 15,
    "correctPredictions": 12,
    "incorrectPredictions": 3,
    "overallAccuracy": 0.8,
    "lastFeedbackDate": "2026-02-18T10:30:00Z"
  }
}
```

**Response (Accuracy):**

```json
{
  "success": true,
  "data": [
    {
      "category": "Revenue",
      "totalPredictions": 10,
      "correctPredictions": 9,
      "accuracy": 0.9,
      "commonMisclassifications": [
        {
          "predictedAs": "Revenue",
          "actualCategory": "Sales",
          "count": 1
        }
      ]
    }
  ]
}
```

**Example:**

```bash
# Get statistics
curl -X GET "https://techivano.com/api/feedback?type=statistics" \
  -H "Authorization: Bearer <token>"

# Get accuracy by category
curl -X GET "https://techivano.com/api/feedback?type=accuracy" \
  -H "Authorization: Bearer <token>"
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "rowNumber": 5,
      "errorType": "INVALID_DATE",
      "errorMessage": "Invalid date format: 2026-13-01"
    }
  ]
}
```

### Common Error Types

| Error Type               | Description                  | Solution                    |
| ------------------------ | ---------------------------- | --------------------------- |
| `UNSUPPORTED_FILE_TYPE`  | File format not supported    | Use PDF, Excel, CSV, or ZIP |
| `PASSWORD_REQUIRED`      | File is password-protected   | Provide password in request |
| `INVALID_DATE`           | Date cannot be parsed        | Use standard date format    |
| `INVALID_AMOUNT`         | Amount is not a valid number | Check amount format         |
| `MISSING_REQUIRED_FIELD` | Required field is missing    | Provide all required fields |
| `UNAUTHORIZED`           | Authentication failed        | Check JWT token             |
| `RATE_LIMIT_EXCEEDED`    | Too many requests            | Wait before retrying        |
| `SERVER_ERROR`           | Internal server error        | Contact support             |

---

## Supported File Formats

### PDF

- Text-based PDFs (scanned PDFs use OCR fallback)
- Encrypted PDFs (password required)
- Multi-page statements
- Bank-specific layouts

### Excel

- XLSX format
- XLS format (legacy)
- Password-protected files
- Multiple sheets (auto-detection)

### CSV

- UTF-8 encoding
- Latin-1 encoding
- Windows-1252 encoding
- Auto-delimiter detection (comma, semicolon, tab, pipe)

### ZIP

- Multiple statement files
- Mixed formats (PDF + Excel + CSV)
- Encrypted ZIPs (password required)
- Automatic deduplication across files

---

## Transaction Categories

The system supports 25+ transaction categories:

```
Revenue, Sales, Refunds, Cost of Goods Sold, Salaries & Wages,
Rent & Utilities, Office Supplies, Marketing & Advertising,
Professional Services, Travel & Transportation, Meals & Entertainment,
Insurance, Taxes & Levies, Loan Repayment, Equipment & Fixed Assets,
Maintenance & Repairs, Telecommunications, Bank Fees, Interest Income,
Interest Expense, Dividends, Other Income, Other Expense, Transfer,
Uncategorized
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Per-User Limit:** 100 requests per minute
- **Per-Endpoint Limit:** 10 requests per minute for /api/ingest
- **Retry-After Header:** Indicates when to retry

**Response Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645123456
```

**Rate Limit Exceeded Response:**

```json
{
  "success": false,
  "message": "Rate limit exceeded. Please retry after 60 seconds.",
  "retryAfter": 60
}
```

---

## Best Practices

### 1. Error Handling

Always check the `success` field and handle errors gracefully:

```javascript
const response = await fetch("/api/ingest", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

const data = await response.json();

if (!data.success) {
  if (data.message === "PASSWORD_REQUIRED") {
    // Prompt user for password
  } else {
    // Show error message
    console.error(data.errors);
  }
}
```

### 2. Retry Logic

Implement exponential backoff for retries:

```javascript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

### 3. File Size Optimization

Keep files under 100 MB:

```javascript
if (file.size > 100 * 1024 * 1024) {
  throw new Error("File exceeds 100 MB limit");
}
```

### 4. Batch Processing

Process transactions in batches for better performance:

```javascript
const batchSize = 50;
for (let i = 0; i < transactionIds.length; i += batchSize) {
  const batch = transactionIds.slice(i, i + batchSize);
  await categorizeTransactions(batch);
}
```

---

## Webhooks (Future)

Webhooks will be available for:

- File ingestion completion
- Categorization completion
- User feedback recorded
- System alerts

---

## Support

For API support:

- **Email:** support@ivano.com
- **Documentation:** https://docs.ivano.com
- **Status Page:** https://status.ivano.com
- **Slack:** #api-support

---

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0.0   | 2026-02-18 | Initial release |

---

## Changelog

### v1.0.0 (2026-02-18)

- Initial API release
- File ingestion endpoints
- AI categorization
- Feedback loop
- Analytics endpoints
