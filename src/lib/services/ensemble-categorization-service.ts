/**
 * HIGH-004: Ensemble Categorization Service
 * Unified categorization with LLM -> Rule -> ML fallback chain
 * Provides robust categorization with confidence-based recommendations
 */

import { llmCategorize, LLMCategorizationInput, LLMCategorizationResult } from './llm-categorization-service';
import { categorizeTransaction, Category as RuleCategory } from './categorization-service';

export interface EnsembleCategorizationInput {
  merchant: string;
  amount: number;
  type?: 'debit' | 'credit';
  channel?: string;
  timestamp?: string;
  description?: string;
}

export interface EnsembleCategorizationResult {
  category: string;
  confidence: number; // 0-100
  method: 'LLM' | 'RULE' | 'ML' | 'FALLBACK';
  recommendation: 'AUTO_ACCEPT' | 'SUGGEST' | 'MANUAL_REVIEW';
  reasoning: string;
  alternatives?: Array<{
    category: string;
    confidence: number;
    method: string;
  }>;
  inference_id: string;
}

interface CategoryOption {
  name: string;
  type: string;
  tax_treatment: string;
}

// Confidence thresholds (can be overridden via environment variables)
const CONFIDENCE_THRESHOLDS = {
  AUTO_ACCEPT: parseFloat(process.env.LLM_AUTO_ACCEPT_THRESHOLD || '80'),
  SUGGEST: parseFloat(process.env.LLM_SUGGEST_THRESHOLD || '50'),
  MANUAL_REVIEW: 0
};

/**
 * Determine recommendation based on confidence threshold
 */
function getRecommendation(confidence: number): 'AUTO_ACCEPT' | 'SUGGEST' | 'MANUAL_REVIEW' {
  if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_ACCEPT) {
    return 'AUTO_ACCEPT';
  } else if (confidence >= CONFIDENCE_THRESHOLDS.SUGGEST) {
    return 'SUGGEST';
  } else {
    return 'MANUAL_REVIEW';
  }
}

/**
 * Categorize using rule-based system
 */
async function ruleCategorize(
  input: EnsembleCategorizationInput,
  categories: CategoryOption[]
): Promise<{ category: string; confidence: number; reasoning: string } | null> {
  try {
    // Convert CategoryOption to RuleCategory format
    const ruleCategories: RuleCategory[] = categories.map(c => ({
      id: c.name.toLowerCase().replace(/\s+/g, '_'),
      name: c.name,
      category_type: c.type as 'income' | 'expense' | 'asset' | 'liability',
      tax_treatment: c.tax_treatment as 'deductible' | 'non_deductible' | 'capital_allowance' | 'exempt',
      keywords: [] // Keywords would need to be provided or configured
    }));

    // Use existing rule-based categorization service
    const result = categorizeTransaction(input.merchant, ruleCategories);

    if (result && result.categoryName && result.categoryName !== 'Uncategorized') {
      return {
        category: result.categoryName,
        confidence: result.confidenceScore || 60,
        reasoning: `Matched by rule-based system using keywords and patterns`
      };
    }

    return null;
  } catch (error) {
    console.error('Rule categorization failed:', error);
    return null;
  }
}

/**
 * Categorize using ML model
 */
async function mlCategorize(
  input: EnsembleCategorizationInput
): Promise<{ category: string; confidence: number; reasoning: string } | null> {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    
    const response = await fetch(`${mlServiceUrl}/categorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant: input.merchant,
        amount: input.amount,
        channel: input.channel,
        timestamp: input.timestamp
      })
    });

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    const result = await response.json();

    if (result && result.category) {
      // Convert ML confidence (0-1) to percentage (0-100)
      const confidence = (result.adjusted_confidence || result.confidence || 0.5) * 100;
      
      return {
        category: result.category,
        confidence: Math.round(confidence),
        reasoning: `ML model prediction (merchant confidence: ${(result.merchant_confidence * 100).toFixed(0)}%)`
      };
    }

    return null;
  } catch (error) {
    console.error('ML categorization failed:', error);
    return null;
  }
}

/**
 * HIGH-004: Ensemble categorization with LLM -> Rule -> ML fallback
 */
export async function ensembleCategorize(
  input: EnsembleCategorizationInput,
  categories: CategoryOption[]
): Promise<EnsembleCategorizationResult> {
  const alternatives: Array<{ category: string; confidence: number; method: string }> = [];
  const inferenceId = `ensemble-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Step 1: Try LLM categorization (highest quality, but slowest and most expensive)
  try {
    const llmInput: LLMCategorizationInput = {
      merchant: input.merchant,
      amount: input.amount,
      type: input.type,
      channel: input.channel,
      timestamp: input.timestamp
    };

    const llmResult = await llmCategorize(llmInput, categories);

    // If LLM has high confidence, use it
    if (llmResult.confidence >= CONFIDENCE_THRESHOLDS.AUTO_ACCEPT) {
      return {
        category: llmResult.category,
        confidence: llmResult.confidence,
        method: 'LLM',
        recommendation: 'AUTO_ACCEPT',
        reasoning: llmResult.reasoning,
        inference_id: inferenceId
      };
    }

    // Store LLM result as alternative
    alternatives.push({
      category: llmResult.category,
      confidence: llmResult.confidence,
      method: 'LLM'
    });

    // If LLM has medium confidence, try other methods for validation
    if (llmResult.confidence >= CONFIDENCE_THRESHOLDS.SUGGEST) {
      // Try rule-based for validation
      const ruleResult = await ruleCategorize(input, categories);
      if (ruleResult && ruleResult.category === llmResult.category) {
        // Both agree - increase confidence
        return {
          category: llmResult.category,
          confidence: Math.min(100, llmResult.confidence + 10),
          method: 'LLM',
          recommendation: getRecommendation(llmResult.confidence + 10),
          reasoning: `${llmResult.reasoning} (validated by rule-based system)`,
          alternatives,
          inference_id: inferenceId
        };
      }

      if (ruleResult) {
        alternatives.push({
          category: ruleResult.category,
          confidence: ruleResult.confidence,
          method: 'RULE'
        });
      }

      // Return LLM result with SUGGEST recommendation
      return {
        category: llmResult.category,
        confidence: llmResult.confidence,
        method: 'LLM',
        recommendation: 'SUGGEST',
        reasoning: llmResult.reasoning,
        alternatives,
        inference_id: inferenceId
      };
    }

  } catch (error) {
    console.error('LLM categorization failed, falling back to rule-based:', error);
  }

  // Step 2: Try rule-based categorization (fast, deterministic)
  try {
    const ruleResult = await ruleCategorize(input, categories);

    if (ruleResult && ruleResult.confidence >= CONFIDENCE_THRESHOLDS.SUGGEST) {
      // Try ML for validation
      const mlResult = await mlCategorize(input);
      if (mlResult && mlResult.category === ruleResult.category) {
        // Both agree - increase confidence
        return {
          category: ruleResult.category,
          confidence: Math.min(100, ruleResult.confidence + 15),
          method: 'RULE',
          recommendation: getRecommendation(ruleResult.confidence + 15),
          reasoning: `${ruleResult.reasoning} (validated by ML model)`,
          alternatives,
          inference_id: inferenceId
        };
      }

      if (mlResult) {
        alternatives.push({
          category: mlResult.category,
          confidence: mlResult.confidence,
          method: 'ML'
        });
      }

      return {
        category: ruleResult.category,
        confidence: ruleResult.confidence,
        method: 'RULE',
        recommendation: getRecommendation(ruleResult.confidence),
        reasoning: ruleResult.reasoning,
        alternatives,
        inference_id: inferenceId
      };
    }

    if (ruleResult) {
      alternatives.push({
        category: ruleResult.category,
        confidence: ruleResult.confidence,
        method: 'RULE'
      });
    }

  } catch (error) {
    console.error('Rule categorization failed, falling back to ML:', error);
  }

  // Step 3: Try ML categorization (good for known patterns)
  try {
    const mlResult = await mlCategorize(input);

    if (mlResult) {
      return {
        category: mlResult.category,
        confidence: mlResult.confidence,
        method: 'ML',
        recommendation: getRecommendation(mlResult.confidence),
        reasoning: mlResult.reasoning,
        alternatives,
        inference_id: inferenceId
      };
    }

  } catch (error) {
    console.error('ML categorization failed, using fallback:', error);
  }

  // Step 4: Fallback - return uncategorized with manual review recommendation
  return {
    category: 'Uncategorized',
    confidence: 0,
    method: 'FALLBACK',
    recommendation: 'MANUAL_REVIEW',
    reasoning: 'All categorization methods failed or returned low confidence',
    alternatives,
    inference_id: inferenceId
  };
}

/**
 * Batch ensemble categorization
 */
export async function ensembleBatchCategorize(
  inputs: EnsembleCategorizationInput[],
  categories: CategoryOption[]
): Promise<EnsembleCategorizationResult[]> {
  // Process in parallel with concurrency limit
  const CONCURRENCY_LIMIT = 5;
  const results: EnsembleCategorizationResult[] = [];

  for (let i = 0; i < inputs.length; i += CONCURRENCY_LIMIT) {
    const batch = inputs.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map(input => ensembleCategorize(input, categories))
    );
    results.push(...batchResults);
  }

  return results;
}
