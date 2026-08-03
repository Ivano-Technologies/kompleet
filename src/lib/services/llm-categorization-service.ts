/**
 * LLM-based Transaction Categorization Service
 *
 * Routes through the AI provider factory (Claude primary; OpenAI/Kimi fallback).
 * Replaces the previous hard-coded OpenAI gpt-4o-mini client.
 * See docs/AI_SIMPLIFICATION_PLAN.md.
 */

import {
  getProviderWithFallback,
  getPrimaryProvider,
} from "@/lib/ai/providers/factory";
import type { CategorizationRequest } from "@/lib/ai/providers/types";

export interface LLMCategorizationInput {
  merchant: string;
  amount: number;
  type?: "debit" | "credit";
  channel?: string;
  timestamp?: string;
  description?: string;
}

export interface LLMCategorizationResult {
  category: string;
  confidence: number; // 0-100
  reasoning: string;
  inference_id: string;
  provider?: string;
}

interface CategoryOption {
  name: string;
  type: string;
  tax_treatment: string;
}

function toRequest(input: LLMCategorizationInput): CategorizationRequest {
  return {
    description: input.description || input.merchant,
    amount: input.amount,
    transactionType: input.type === "credit" ? "credit" : "debit",
    date: input.timestamp,
    merchant: input.merchant,
  };
}

/**
 * Categorize a single transaction via the provider factory.
 * `categories` is retained for call-site compatibility; providers use their
 * built-in Nigerian SME category lists today.
 */
export async function llmCategorize(
  input: LLMCategorizationInput,
  _categories: CategoryOption[],
): Promise<LLMCategorizationResult> {
  const provider = await getProviderWithFallback();
  const prediction = await provider.categorize(toRequest(input));

  return {
    category: prediction.category || "Uncategorized",
    confidence: Math.min(100, Math.max(0, prediction.confidence ?? 50)),
    reasoning: prediction.reasoning || "",
    inference_id: `llm-${provider.name}-${Date.now()}`,
    provider: provider.name,
  };
}

/**
 * Categorize multiple transactions. Uses provider batch when available;
 * otherwise falls back to bounded parallel single calls.
 */
export async function llmBatchCategorize(
  transactions: LLMCategorizationInput[],
  categories: CategoryOption[],
): Promise<LLMCategorizationResult[]> {
  const provider = await getPrimaryProvider();

  if (provider.categorizeBatch) {
    const predictions = await provider.categorizeBatch(
      transactions.map(toRequest),
    );
    const base = `llm-batch-${provider.name}-${Date.now()}`;
    return predictions.map((prediction, i) => ({
      category: prediction.category || "Uncategorized",
      confidence: Math.min(100, Math.max(0, prediction.confidence ?? 50)),
      reasoning: prediction.reasoning || "",
      inference_id: `${base}-${i}`,
      provider: provider.name,
    }));
  }

  const CONCURRENCY = 5;
  const results: LLMCategorizationResult[] = [];
  for (let i = 0; i < transactions.length; i += CONCURRENCY) {
    const slice = transactions.slice(i, i + CONCURRENCY);
    const batch = await Promise.all(
      slice.map((txn) => llmCategorize(txn, categories)),
    );
    results.push(...batch);
  }
  return results;
}
