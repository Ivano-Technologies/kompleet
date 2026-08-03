/**
 * Ensemble Categorization Service
 * Chain: LLM (Claude via factory) → Rules → MANUAL_REVIEW
 *
 * ML tier removed (docs/AI_SIMPLIFICATION_PLAN.md). Confidence routing
 * AUTO_ACCEPT / SUGGEST / MANUAL_REVIEW is unchanged.
 */

import {
  llmCategorize,
  LLMCategorizationInput,
} from "./llm-categorization-service";
import {
  categorizeTransaction,
  Category as RuleCategory,
} from "./categorization-service";

export interface EnsembleCategorizationInput {
  merchant: string;
  amount: number;
  type?: "debit" | "credit";
  channel?: string;
  timestamp?: string;
  description?: string;
}

export interface EnsembleCategorizationResult {
  category: string;
  confidence: number; // 0-100
  method: "LLM" | "RULE" | "FALLBACK";
  recommendation: "AUTO_ACCEPT" | "SUGGEST" | "MANUAL_REVIEW";
  reasoning: string;
  alternatives?: Array<{
    category: string;
    confidence: number;
    method: string;
  }>;
  inference_id: string;
}

export interface CategoryOption {
  name: string;
  type: string;
  tax_treatment: string;
  /** Populated from categories.keywords — required for the rules tier. */
  keywords?: string[];
}

const CONFIDENCE_THRESHOLDS = {
  AUTO_ACCEPT: parseFloat(
    process.env.LLM_AUTO_ACCEPT_THRESHOLD ||
      process.env.ML_AUTO_ACCEPT_THRESHOLD ||
      "80",
  ),
  SUGGEST: parseFloat(
    process.env.LLM_SUGGEST_THRESHOLD ||
      process.env.ML_SUGGEST_THRESHOLD ||
      "50",
  ),
  MANUAL_REVIEW: 0,
};

function getRecommendation(
  confidence: number,
): "AUTO_ACCEPT" | "SUGGEST" | "MANUAL_REVIEW" {
  if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_ACCEPT) {
    return "AUTO_ACCEPT";
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.SUGGEST) {
    return "SUGGEST";
  }
  return "MANUAL_REVIEW";
}

async function ruleCategorize(
  input: EnsembleCategorizationInput,
  categories: CategoryOption[],
): Promise<{ category: string; confidence: number; reasoning: string } | null> {
  try {
    const ruleCategories: RuleCategory[] = categories.map((c) => ({
      id: c.name.toLowerCase().replace(/\s+/g, "_"),
      name: c.name,
      category_type: c.type as "income" | "expense" | "asset" | "liability",
      tax_treatment: c.tax_treatment as
        | "deductible"
        | "non_deductible"
        | "capital_allowance"
        | "exempt",
      // Pass real keywords — empty array matched nothing on every call.
      keywords: c.keywords ?? [],
    }));

    const result = categorizeTransaction(input.merchant, ruleCategories);

    if (
      result &&
      result.categoryName &&
      result.categoryName !== "Uncategorized"
    ) {
      return {
        category: result.categoryName,
        confidence: result.confidenceScore || 60,
        reasoning: "Matched by rule-based system using keywords and patterns",
      };
    }

    return null;
  } catch (error) {
    console.error("Rule categorization failed:", error);
    return null;
  }
}

/**
 * Ensemble: LLM → Rules → MANUAL_REVIEW
 */
export async function ensembleCategorize(
  input: EnsembleCategorizationInput,
  categories: CategoryOption[],
): Promise<EnsembleCategorizationResult> {
  const alternatives: Array<{
    category: string;
    confidence: number;
    method: string;
  }> = [];
  const inferenceId = `ensemble-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    const llmInput: LLMCategorizationInput = {
      merchant: input.merchant,
      amount: input.amount,
      type: input.type,
      channel: input.channel,
      timestamp: input.timestamp,
      description: input.description,
    };

    const llmResult = await llmCategorize(llmInput, categories);

    if (llmResult.confidence >= CONFIDENCE_THRESHOLDS.AUTO_ACCEPT) {
      return {
        category: llmResult.category,
        confidence: llmResult.confidence,
        method: "LLM",
        recommendation: "AUTO_ACCEPT",
        reasoning: llmResult.reasoning,
        inference_id: inferenceId,
      };
    }

    alternatives.push({
      category: llmResult.category,
      confidence: llmResult.confidence,
      method: "LLM",
    });

    if (llmResult.confidence >= CONFIDENCE_THRESHOLDS.SUGGEST) {
      const ruleResult = await ruleCategorize(input, categories);
      if (ruleResult && ruleResult.category === llmResult.category) {
        return {
          category: llmResult.category,
          confidence: Math.min(100, llmResult.confidence + 10),
          method: "LLM",
          recommendation: getRecommendation(llmResult.confidence + 10),
          reasoning: `${llmResult.reasoning} (validated by rule-based system)`,
          alternatives,
          inference_id: inferenceId,
        };
      }

      if (ruleResult) {
        alternatives.push({
          category: ruleResult.category,
          confidence: ruleResult.confidence,
          method: "RULE",
        });
      }

      return {
        category: llmResult.category,
        confidence: llmResult.confidence,
        method: "LLM",
        recommendation: "SUGGEST",
        reasoning: llmResult.reasoning,
        alternatives,
        inference_id: inferenceId,
      };
    }
  } catch (error) {
    console.error(
      "LLM categorization failed, falling back to rule-based:",
      error,
    );
  }

  try {
    const ruleResult = await ruleCategorize(input, categories);

    if (ruleResult) {
      return {
        category: ruleResult.category,
        confidence: ruleResult.confidence,
        method: "RULE",
        recommendation: getRecommendation(ruleResult.confidence),
        reasoning: ruleResult.reasoning,
        alternatives,
        inference_id: inferenceId,
      };
    }
  } catch (error) {
    console.error("Rule categorization failed:", error);
  }

  return {
    category: "Uncategorized",
    confidence: 0,
    method: "FALLBACK",
    recommendation: "MANUAL_REVIEW",
    reasoning: "All categorization methods failed or returned low confidence",
    alternatives,
    inference_id: inferenceId,
  };
}

export async function ensembleBatchCategorize(
  inputs: EnsembleCategorizationInput[],
  categories: CategoryOption[],
): Promise<EnsembleCategorizationResult[]> {
  const CONCURRENCY_LIMIT = 5;
  const results: EnsembleCategorizationResult[] = [];

  for (let i = 0; i < inputs.length; i += CONCURRENCY_LIMIT) {
    const batch = inputs.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((input) => ensembleCategorize(input, categories)),
    );
    results.push(...batchResults);
  }

  return results;
}
