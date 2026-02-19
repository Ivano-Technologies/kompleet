/**
 * AI Categorization Service
 * Uses OpenAI to categorize transactions with confidence scoring
 */

import OpenAI from 'openai';
import { Transaction } from '@/lib/ingestion/types';

export interface CategoryPrediction {
  transactionId: string;
  category: string;
  confidence: number;
  reasoning: string;
  alternativeCategories?: Array<{ category: string; confidence: number }>;
}

export interface CategorizationResult {
  predictions: CategoryPrediction[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  averageConfidence: number;
}

// Standard transaction categories for Nigerian businesses
const TRANSACTION_CATEGORIES = [
  'Revenue',
  'Sales',
  'Refunds',
  'Cost of Goods Sold',
  'Salaries & Wages',
  'Rent & Utilities',
  'Office Supplies',
  'Marketing & Advertising',
  'Professional Services',
  'Travel & Transportation',
  'Meals & Entertainment',
  'Insurance',
  'Taxes & Levies',
  'Loan Repayment',
  'Equipment & Fixed Assets',
  'Maintenance & Repairs',
  'Telecommunications',
  'Bank Fees',
  'Interest Income',
  'Interest Expense',
  'Dividends',
  'Other Income',
  'Other Expense',
  'Transfer',
  'Uncategorized',
];

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in environment variables.');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

/**
 * Categorize transactions using AI
 */
export async function categorizeTransactions(
  transactions: Transaction[],
  userContext?: {
    businessType?: string;
    industry?: string;
    previousCategories?: Record<string, string>;
  }
): Promise<CategorizationResult> {
  const predictions: CategoryPrediction[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const transaction of transactions) {
    try {
      const prediction = await categorizeTransaction(transaction, userContext);
      predictions.push(prediction);
      successCount++;
    } catch (error) {
      console.error(`Failed to categorize transaction ${transaction.id}:`, error);
      predictions.push({
        transactionId: transaction.id,
        category: 'Uncategorized',
        confidence: 0,
        reasoning: 'Failed to categorize',
      });
      failureCount++;
    }
  }

  const averageConfidence =
    predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
      : 0;

  return {
    predictions,
    totalProcessed: transactions.length,
    successCount,
    failureCount,
    averageConfidence,
  };
}

/**
 * Categorize a single transaction
 */
export async function categorizeTransaction(
  transaction: Transaction,
  userContext?: {
    businessType?: string;
    industry?: string;
    previousCategories?: Record<string, string>;
  }
): Promise<CategoryPrediction> {
  const prompt = buildCategorizationPrompt(transaction, userContext);

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content || '';

  // Parse the response
  const result = parseCategorizationResponse(responseText, transaction.id);

  return result;
}

/**
 * Build the categorization prompt
 */
function buildCategorizationPrompt(
  transaction: Transaction,
  userContext?: {
    businessType?: string;
    industry?: string;
    previousCategories?: Record<string, string>;
  }
): string {
  const categories = TRANSACTION_CATEGORIES.join(', ');

  let contextInfo = '';
  if (userContext?.businessType) {
    contextInfo += `\nBusiness Type: ${userContext.businessType}`;
  }
  if (userContext?.industry) {
    contextInfo += `\nIndustry: ${userContext.industry}`;
  }

  const previousExamples =
    userContext?.previousCategories && Object.keys(userContext.previousCategories).length > 0
      ? `\nPrevious categorizations (for reference):\n${Object.entries(userContext.previousCategories)
          .slice(0, 5)
          .map(([desc, cat]) => `- "${desc}" → ${cat}`)
          .join('\n')}`
      : '';

  return `You are an expert accountant helping to categorize business transactions for a Nigerian company.

${contextInfo}${previousExamples}

Categorize the following transaction:
- Date: ${transaction.date}
- Amount: ${transaction.amount} ${transaction.currency || 'NGN'}
- Type: ${transaction.type}
- Description: ${transaction.description}
- Counterparty: ${transaction.description || 'Unknown'}

Available categories:
${categories}

Respond in JSON format with:
{
  "category": "chosen category",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "alternatives": [
    {"category": "alternative", "confidence": 0.0-1.0}
  ]
}

Rules:
1. Choose the MOST specific category that matches the transaction
2. Confidence should reflect how certain you are (0.0 = not sure, 1.0 = very sure)
3. For ambiguous transactions, choose "Other Income" or "Other Expense"
4. Consider Nigerian business context and tax implications
5. Provide 2-3 alternative categories if confidence < 0.9`;
}

/**
 * Parse the categorization response
 */
function parseCategorizationResponse(
  responseText: string,
  transactionId: string
): CategoryPrediction {
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      transactionId,
      category: parsed.category || 'Uncategorized',
      confidence: Math.min(Math.max(parsed.confidence || 0, 0), 1),
      reasoning: parsed.reasoning || '',
      alternativeCategories: parsed.alternatives || [],
    };
  } catch (error) {
    console.error('Failed to parse categorization response:', error);
    return {
      transactionId,
      category: 'Uncategorized',
      confidence: 0,
      reasoning: 'Failed to parse AI response',
    };
  }
}

/**
 * Get category suggestions based on description
 */
export async function getCategorySuggestions(
  description: string,
  limit: number = 5
): Promise<Array<{ category: string; confidence: number }>> {
  const prompt = `Given the transaction description: "${description}"
  
Suggest the top ${limit} most likely transaction categories from this list:
${TRANSACTION_CATEGORIES.join(', ')}

Respond in JSON format:
{
  "suggestions": [
    {"category": "category name", "confidence": 0.0-1.0}
  ]
}`;

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content || '';

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.suggestions || []).slice(0, limit);
  } catch (error) {
    console.error('Failed to parse suggestions:', error);
    return [];
  }
}

/**
 * Get available categories
 */
export function getAvailableCategories(): string[] {
  return TRANSACTION_CATEGORIES;
}
