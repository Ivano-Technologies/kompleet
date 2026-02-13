import OpenAI from 'openai';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in environment variables.');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

export interface LLMCategorizationInput {
  merchant: string;
  amount: number;
  type?: 'debit' | 'credit';
  channel?: string;
  timestamp?: string;
}

export interface LLMCategorizationResult {
  category: string;
  confidence: number; // 0-100
  reasoning: string;
  inference_id: string;
}

interface CategoryOption {
  name: string;
  type: string;
  tax_treatment: string;
}

/**
 * Categorize a single transaction using OpenAI
 */
export async function llmCategorize(
  input: LLMCategorizationInput,
  categories: CategoryOption[]
): Promise<LLMCategorizationResult> {
  const categoryList = categories
    .map(c => `- ${c.name} (${c.type}, ${c.tax_treatment})`)
    .join('\n');

  const startTime = Date.now();

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content: `You are a Nigerian financial transaction categorizer for SMEs. Given a transaction description and amount, classify it into one of the provided categories. Return JSON only.

Available categories:
${categoryList}

Rules:
- Match to the most specific category
- Nigerian merchant names: POS = point of sale purchase, ATM = cash withdrawal, NIP = interbank transfer
- Naira (₦/NGN) amounts
- "DR" suffix = debit, "CR" suffix = credit
- Return confidence 80-100 for clear matches, 50-79 for reasonable guesses, below 50 for uncertain`,
      },
      {
        role: 'user',
        content: `Transaction: "${input.merchant}"
Amount: ${input.amount}
Type: ${input.type || 'unknown'}
${input.channel ? `Channel: ${input.channel}` : ''}

Respond with JSON: {"category": "exact category name", "confidence": number, "reasoning": "brief explanation"}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const latencyMs = Date.now() - startTime;
  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  return {
    category: parsed.category || 'Uncategorized',
    confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
    reasoning: parsed.reasoning || '',
    inference_id: `llm-${completion.id || Date.now()}`,
  };
}

/**
 * Categorize multiple transactions in a single LLM call (batch)
 */
export async function llmBatchCategorize(
  transactions: LLMCategorizationInput[],
  categories: CategoryOption[]
): Promise<LLMCategorizationResult[]> {
  const categoryList = categories
    .map(c => `- ${c.name} (${c.type}, ${c.tax_treatment})`)
    .join('\n');

  const txnList = transactions
    .map((t, i) => `${i + 1}. "${t.merchant}" | Amount: ${t.amount} | Type: ${t.type || 'unknown'}`)
    .join('\n');

  const startTime = Date.now();

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    max_tokens: transactions.length * 100,
    messages: [
      {
        role: 'system',
        content: `You are a Nigerian financial transaction categorizer for SMEs. Categorize each transaction into one of the provided categories. Return a JSON array.

Available categories:
${categoryList}

Rules:
- Match to the most specific category
- Nigerian merchant names: POS = point of sale, ATM = cash withdrawal, NIP = interbank transfer
- Naira (₦/NGN) amounts
- Return confidence 80-100 for clear matches, 50-79 for reasonable guesses, below 50 for uncertain`,
      },
      {
        role: 'user',
        content: `Categorize these ${transactions.length} transactions:
${txnList}

Respond with JSON: {"results": [{"index": 1, "category": "name", "confidence": number, "reasoning": "brief"}]}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const latencyMs = Date.now() - startTime;
  const content = completion.choices[0]?.message?.content || '{"results":[]}';
  const parsed = JSON.parse(content);

  const inferenceBase = `llm-batch-${completion.id || Date.now()}`;

  return transactions.map((_, i) => {
    const result = parsed.results?.find((r: { index: number }) => r.index === i + 1);
    return {
      category: result?.category || 'Uncategorized',
      confidence: Math.min(100, Math.max(0, result?.confidence || 50)),
      reasoning: result?.reasoning || '',
      inference_id: `${inferenceBase}-${i}`,
    };
  });
}
