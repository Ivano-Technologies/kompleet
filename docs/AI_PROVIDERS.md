# KOMPLEET Platform - AI Provider Documentation

## Overview

The KOMPLEET platform uses AI to automatically categorize financial transactions. The system supports multiple AI providers with automatic fallback to ensure high availability and reliability.

---

## Supported Providers

| Provider | Description | API Required | Availability |
|---|---|---|---|
| **OpenAI** (Primary) | OpenAI GPT-4 Turbo | Yes | When `OPENAI_API_KEY` is set |
| **Claude** (Secondary 1) | Anthropic Claude 3.5 Sonnet | Yes | When `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` is set |
| **Kimi 2.5** (Secondary 2) | Moonshot AI's Kimi model via OpenAI-compatible API | Yes | When `KIMI_API_KEY` or `MOONSHOT_API_KEY` is set |
| **Fallback** (Tertiary) | Rule-based keyword matching | No | Always available |

---

## Provider Selection Logic

The system automatically selects the best available provider using this logic:

1.  **Check Environment Variable**: If `AI_PROVIDER` is set, try that provider first
2.  **Try OpenAI**: If OpenAI API key is available, use GPT-4 Turbo
3.  **Try Claude**: If Anthropic API key is available, use Claude 3.5 Sonnet
4.  **Try Kimi**: If Kimi API key is available, use Kimi 2.5
5.  **Use Fallback**: Always available as last resort

### Automatic Fallback

If a provider fails or returns low confidence (< 50%), the system automatically tries the next available provider. This ensures transactions are always categorized, even if the primary AI service is unavailable.

---

## Configuration

### Environment Variables

```bash
# Preferred provider (optional)
AI_PROVIDER=openai  # Options: openai, claude, kimi, fallback

# OpenAI API Key (Primary)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Claude API Key (Secondary 1)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
# OR
CLAUDE_API_KEY=your_claude_api_key_here

# Kimi API Key (Secondary 2)
KIMI_API_KEY=your_kimi_api_key_here
# OR
MOONSHOT_API_KEY=your_moonshot_api_key_here
```

### Provider Priority

The default priority order is:
1.  OpenAI GPT-4 Turbo (primary - high accuracy and reliability)
2.  Claude 3.5 Sonnet (secondary 1 - excellent reasoning)
3.  Kimi 2.5 (secondary 2 - fast and cost-effective)
4.  Fallback rules engine (tertiary - always available)

You can override this by setting `AI_PROVIDER` to your preferred provider.

---

## Provider Details

### OpenAI GPT-4 Turbo (Primary)

**Model**: `gpt-4-turbo-preview`  
**API Endpoint**: `https://api.openai.com/v1`  
**Features**:
-   Industry-leading accuracy
-   Excellent reasoning capabilities
-   Good at handling ambiguous transactions
-   Reliable and well-tested

**Example Configuration**:
```typescript
import { OpenAIProvider } from '@/lib/ai/providers/openai-provider';

const provider = new OpenAIProvider(process.env.OPENAI_API_KEY);
const result = await provider.categorize({
  description: 'POS Purchase - Shoprite',
  amount: 15000,
  transactionType: 'debit',
});
```

### Claude 3.5 Sonnet (Secondary 1)

**Model**: `claude-3-5-sonnet-20241022`  
**API Endpoint**: `https://api.anthropic.com/v1`  
**Features**:
-   Excellent reasoning and analysis
-   Strong structured output capabilities
-   Good at understanding context and nuance
-   Reliable for financial categorization

**Example Configuration**:
```typescript
import { ClaudeProvider } from '@/lib/ai/providers/claude-provider';

const provider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY);
const result = await provider.categorize({
  description: 'Marketing campaign - Facebook Ads',
  amount: 50000,
  transactionType: 'debit',
});
```

### Kimi 2.5 (Secondary 2)

**Model**: `moonshot-v1-8k`  
**API Endpoint**: `https://api.moonshot.cn/v1`  
**Features**:
-   OpenAI-compatible API
-   Fast response times
-   Cost-effective
-   Good understanding of Nigerian business context

**Example Configuration**:
```typescript
import { KimiProvider } from '@/lib/ai/providers/kimi-provider';

const provider = new KimiProvider(process.env.KIMI_API_KEY);
const result = await provider.categorize({
  description: 'Transfer to supplier',
  amount: 50000,
  transactionType: 'debit',
});
```

### Fallback Rules Engine (Tertiary)

**Features**:
-   No API key required
-   Always available
-   Fast (< 1ms response time)
-   Based on keyword matching and transaction patterns

**Example Configuration**:
```typescript
import { FallbackProvider } from '@/lib/ai/providers/fallback-provider';

const provider = new FallbackProvider();
const result = await provider.categorize({
  description: 'Salary payment to staff',
  amount: 200000,
  transactionType: 'debit',
});
```

---

## Usage Examples

### Basic Usage

```typescript
import { getProviderWithFallback } from '@/lib/ai/providers/factory';

// Get a provider with automatic fallback
const provider = await getProviderWithFallback();

// Categorize a transaction
const result = await provider.categorize({
  description: 'Electricity bill - EKEDC',
  amount: 25000,
  transactionType: 'debit',
  date: '2026-01-15',
});

console.log(`Category: ${result.category}`);
console.log(`Confidence: ${result.confidence}%`);
console.log(`Reasoning: ${result.reasoning}`);
```

### Using a Specific Provider

```typescript
import { OpenAIProvider } from '@/lib/ai/providers/openai-provider';

const provider = new OpenAIProvider();

if (await provider.isAvailable()) {
  const result = await provider.categorize({
    description: 'Marketing campaign - Facebook Ads',
    amount: 50000,
    transactionType: 'debit',
  });
  
  console.log(result);
}
```

### Batch Categorization

```typescript
import { categorizeTransactions } from '@/lib/ai/categorizationService';

const transactions = [
  { id: '1', description: 'Rent payment', amount: 150000, transaction_type: 'debit' },
  { id: '2', description: 'Sales revenue', amount: 200000, transaction_type: 'credit' },
];

const result = await categorizeTransactions(transactions);

console.log(`Processed: ${result.totalProcessed}`);
console.log(`Success: ${result.successCount}`);
console.log(`Average confidence: ${result.averageConfidence}%`);
```

---

## Fallback Rules

The fallback provider uses keyword-based rules to categorize transactions. Here are some examples:

| Keywords | Category | Transaction Type | Confidence |
|---|---|---|---|
| salary, wages, payroll | Salaries & Wages | Debit | 90% |
| rent, electricity, ekedc, phcn | Rent & Utilities | Debit | 85% |
| mtn, glo, airtel, internet | Telecommunications | Debit | 90% |
| fuel, petrol, uber, bolt | Travel & Transportation | Debit | 85% |
| bank charge, commission | Bank Fees | Debit | 95% |
| tax, vat, wht, levy | Taxes & Levies | Debit | 90% |

The fallback provider is particularly useful for:
-   Common, recurring transactions
-   Transactions with clear keywords
-   Offline or low-connectivity scenarios

---

## Adding a New Provider

To add support for a new AI provider:

### Step 1: Create Provider Class

Create a new file `src/lib/ai/providers/your-provider.ts`:

```typescript
import { AIProvider, CategoryPrediction, CategorizationRequest } from './types';

export class YourProvider implements AIProvider {
  name = 'your-provider';

  async isAvailable(): Promise<boolean> {
    // Check if API key is available
    return !!process.env.YOUR_API_KEY;
  }

  async categorize(request: CategorizationRequest): Promise<CategoryPrediction> {
    // Implement categorization logic
    // ...
  }
}
```

### Step 2: Update Factory

Edit `src/lib/ai/providers/factory.ts` to include your provider:

```typescript
import { YourProvider } from './your-provider';

const DEFAULT_PROVIDER_ORDER = [
  'your-provider', // Add your provider
  'kimi',
  'openai',
  'fallback',
];
```

### Step 3: Add Configuration

Update `ProviderConfig` type in `types.ts`:

```typescript
export interface ProviderConfig {
  provider: 'openai' | 'kimi' | 'your-provider' | 'fallback';
  // ...
}
```

---

## Best Practices

1.  **Always use `getProviderWithFallback()`** for production code to ensure high availability
2.  **Set `AI_PROVIDER` environment variable** to control which provider is used
3.  **Monitor confidence scores** - low confidence may indicate the need for better training data
4.  **Use the fallback provider for testing** when you don't want to consume API credits
5.  **Log provider usage** to track which provider is being used and optimize costs

---

## Troubleshooting

### Provider Not Available

If a provider is not available:
1.  Check that the API key environment variable is set
2.  Verify the API key is valid
3.  Check network connectivity to the API endpoint

### Low Confidence Scores

If you're getting low confidence scores:
1.  Check if the transaction description is clear and descriptive
2.  Consider using the OpenAI provider for complex transactions
3.  Review the fallback rules and add more keywords if needed

### API Rate Limits

If you hit API rate limits:
1.  Implement request throttling
2.  Use batch categorization where possible
3.  Consider using the fallback provider for common transactions

---

## Future Enhancements

-   Support for Claude (Anthropic)
-   Support for Gemini (Google)
-   Custom fine-tuned models
-   User feedback loop for improving categorization
-   A/B testing different providers
