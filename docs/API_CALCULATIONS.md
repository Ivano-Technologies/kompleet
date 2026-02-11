# Tax Calculations API Documentation

**Base URL**: `/api/calculations`
**Authentication**: All endpoints require authentication
**Rate Limiting**: Save endpoint limited to 30 requests/minute

---

## Endpoints Overview

| Method | Endpoint | Description | Rate Limited |
|--------|----------|-------------|--------------|
| POST | `/api/calculations/save` | Save a new calculation | ✅ 30/min |
| GET | `/api/calculations` | Get all user's calculations | ❌ |
| GET | `/api/calculations/[id]` | Get a specific calculation | ❌ |
| PATCH | `/api/calculations/[id]` | Update a calculation (if not finalized) | ❌ |
| DELETE | `/api/calculations/[id]` | Delete a calculation (if not finalized) | ❌ |
| POST | `/api/calculations/[id]/finalize` | Mark calculation as final (lock it) | ❌ |

---

## 1. Save Tax Calculation

Save a new tax calculation to the database.

**Endpoint**: `POST /api/calculations/save`
**Rate Limit**: 30 requests per minute
**Authentication**: Required

### Request Body

```typescript
{
  tax_type: 'pit' | 'cit' | 'vat' | 'wht';  // Required
  tax_year: number;                          // Required (2000-2100)
  input_data: object;                        // Required (JSONB)
  gross_amount: number;                      // Required (in kobo)
  deductions?: number;                       // Optional (in kobo, default: 0)
  taxable_amount: number;                    // Required (in kobo)
  tax_due: number;                           // Required (in kobo)
  effective_rate?: number;                   // Optional (decimal, e.g., 0.1850)
  breakdown: object;                         // Required (JSONB)
  calculation_date?: string;                 // Optional (YYYY-MM-DD, default: today)
  is_final?: boolean;                        // Optional (default: false)
}
```

### Example: Save PIT Calculation

```bash
curl -X POST https://your-domain.com/api/calculations/save \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tax_type": "pit",
    "tax_year": 2026,
    "input_data": {
      "grossIncome": 1500000000,
      "rentIncome": 200000000,
      "pensionContribution": 150000000
    },
    "gross_amount": 1500000000,
    "deductions": 180000000,
    "taxable_amount": 1320000000,
    "tax_due": 252000000,
    "effective_rate": 0.1909,
    "breakdown": {
      "bands": [...],
      "reliefs": {...}
    }
  }'
```

### Response (201 Created)

```json
{
  "success": true,
  "calculation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "tax_type": "pit",
    "tax_year": 2026,
    "calculation_date": "2026-02-11",
    "input_data": {...},
    "gross_amount": 1500000000,
    "deductions": 180000000,
    "taxable_amount": 1320000000,
    "tax_due": 252000000,
    "effective_rate": 0.1909,
    "breakdown": {...},
    "is_final": false,
    "created_at": "2026-02-11T10:30:00Z"
  },
  "message": "Calculation saved successfully"
}
```

### Error Responses

**400 Bad Request** - Missing or invalid fields
```json
{
  "error": "Validation error",
  "message": "Missing required fields: tax_type, tax_year, input_data, amounts, breakdown"
}
```

**401 Unauthorized** - Not authenticated
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 42 seconds.",
  "retryAfter": 42
}
```

---

## 2. Get All Calculations

Retrieve all tax calculations for the authenticated user with optional filters.

**Endpoint**: `GET /api/calculations`
**Authentication**: Required

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `tax_type` | string | Filter by tax type ('pit', 'cit', 'vat', 'wht') | none |
| `tax_year` | number | Filter by tax year | none |
| `is_final` | boolean | Filter by finalized status ('true', 'false') | none |
| `limit` | number | Number of results per page (max 100) | 50 |
| `offset` | number | Pagination offset | 0 |

### Example Requests

```bash
# Get all calculations
GET /api/calculations

# Get all PIT calculations for 2026
GET /api/calculations?tax_type=pit&tax_year=2026

# Get finalized calculations only
GET /api/calculations?is_final=true

# Paginate results
GET /api/calculations?limit=20&offset=40
```

### Response (200 OK)

```json
{
  "success": true,
  "calculations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "tax_type": "pit",
      "tax_year": 2026,
      "calculation_date": "2026-02-11",
      "input_data": {...},
      "gross_amount": 1500000000,
      "deductions": 180000000,
      "taxable_amount": 1320000000,
      "tax_due": 252000000,
      "effective_rate": 0.1909,
      "breakdown": {...},
      "is_final": false,
      "created_at": "2026-02-11T10:30:00Z",
      "amounts": {
        "gross": 1500000000,
        "deductions": 180000000,
        "taxable": 1320000000,
        "tax_due": 252000000,
        "gross_naira": 15000000,
        "deductions_naira": 1800000,
        "taxable_naira": 13200000,
        "tax_due_naira": 2520000
      }
    }
  ],
  "pagination": {
    "total": 125,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "tax_type": "pit",
    "tax_year": 2026,
    "is_final": "all"
  }
}
```

---

## 3. Get Single Calculation

Retrieve a specific tax calculation by ID.

**Endpoint**: `GET /api/calculations/[id]`
**Authentication**: Required

### Example

```bash
GET /api/calculations/550e8400-e29b-41d4-a716-446655440000
```

### Response (200 OK)

```json
{
  "success": true,
  "calculation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "tax_type": "pit",
    "tax_year": 2026,
    "input_data": {...},
    "gross_amount": 1500000000,
    "tax_due": 252000000,
    "breakdown": {...},
    "is_final": false,
    "created_at": "2026-02-11T10:30:00Z"
  }
}
```

### Error Response

**404 Not Found** - Calculation doesn't exist or access denied
```json
{
  "error": "Not found",
  "message": "Calculation not found or access denied"
}
```

---

## 4. Update Calculation

Update an existing calculation (only if not finalized).

**Endpoint**: `PATCH /api/calculations/[id]`
**Authentication**: Required

### Request Body

Only include fields you want to update:

```typescript
{
  input_data?: object;
  gross_amount?: number;       // in kobo
  deductions?: number;
  taxable_amount?: number;
  tax_due?: number;
  effective_rate?: number;
  breakdown?: object;
}
```

### Example

```bash
PATCH /api/calculations/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "tax_due": 260000000,
  "effective_rate": 0.1969,
  "breakdown": {
    "bands": [...]
  }
}
```

### Response (200 OK)

```json
{
  "success": true,
  "calculation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tax_due": 260000000,
    "effective_rate": 0.1969,
    ...
  },
  "message": "Calculation updated successfully"
}
```

### Error Responses

**403 Forbidden** - Calculation is finalized
```json
{
  "error": "Forbidden",
  "message": "Cannot update finalized calculations"
}
```

**400 Bad Request** - No valid fields to update
```json
{
  "error": "Validation error",
  "message": "No valid fields to update"
}
```

---

## 5. Delete Calculation

Delete a calculation (only if not finalized).

**Endpoint**: `DELETE /api/calculations/[id]`
**Authentication**: Required

### Example

```bash
DELETE /api/calculations/550e8400-e29b-41d4-a716-446655440000
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Calculation deleted successfully"
}
```

### Error Response

**403 Forbidden** - Calculation is finalized
```json
{
  "error": "Forbidden",
  "message": "Cannot delete finalized calculations"
}
```

---

## 6. Finalize Calculation

Mark a calculation as final (locked). Once finalized, it cannot be modified or deleted.

**Endpoint**: `POST /api/calculations/[id]/finalize`
**Authentication**: Required

### Example

```bash
POST /api/calculations/550e8400-e29b-41d4-a716-446655440000/finalize
```

### Response (200 OK)

```json
{
  "success": true,
  "calculation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "is_final": true,
    ...
  },
  "message": "Calculation finalized successfully. This calculation is now locked and cannot be modified."
}
```

### Error Response

**400 Bad Request** - Already finalized
```json
{
  "error": "Already finalized",
  "message": "This calculation is already marked as final"
}
```

---

## Frontend Integration Examples

### React/Next.js: Save Calculation

```typescript
async function saveTaxCalculation(data: CalculationInput) {
  const response = await fetch('/api/calculations/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

// Usage in calculator component
const handleSave = async () => {
  try {
    const result = await saveTaxCalculation({
      tax_type: 'pit',
      tax_year: 2026,
      input_data: formData,
      gross_amount: grossIncome * 100, // Convert to kobo
      taxable_amount: taxableIncome * 100,
      tax_due: calculatedTax * 100,
      breakdown: calculationBreakdown,
    });

    toast.success('Calculation saved!');
    router.push(`/calculators/history/${result.calculation.id}`);
  } catch (error) {
    toast.error(error.message);
  }
};
```

### React: Fetch Calculation History

```typescript
function CalculationHistory() {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalculations() {
      const response = await fetch('/api/calculations?tax_type=pit&tax_year=2026');
      const data = await response.json();
      setCalculations(data.calculations);
      setLoading(false);
    }

    fetchCalculations();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {calculations.map((calc) => (
        <CalculationCard
          key={calc.id}
          calculation={calc}
          onDelete={() => deleteCalculation(calc.id)}
          onFinalize={() => finalizeCalculation(calc.id)}
        />
      ))}
    </div>
  );
}
```

---

## Security & Best Practices

### Row Level Security (RLS)
All queries are automatically filtered by `user_id` via Supabase RLS policies. Users can only access their own calculations.

### Amount Storage
- ✅ Store amounts in **kobo** (1/100 Naira) to avoid floating point issues
- Convert for display: `amount_naira = amount_kobo / 100`
- Format for UI: `new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount_naira)`

### Finalization
- Finalized calculations cannot be modified or deleted (protected by RLS)
- Use for calculations that have been filed with FIRS
- Show clear warning before finalizing

### Rate Limiting
- Save endpoint: 30 requests per minute per user
- Use debouncing on "Save" button clicks to prevent accidental spam

### Error Handling
- Always handle 401 (unauthorized) by redirecting to login
- Handle 403 (forbidden) by showing "Cannot modify finalized calculation"
- Handle 429 (rate limit) by showing retry countdown

---

**Last Updated**: February 11, 2026
**Version**: 1.0.0
**Maintainer**: Backend Team
