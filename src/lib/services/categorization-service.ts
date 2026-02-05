/**
 * Transaction Categorization Service
 * Rule-based categorization using keyword matching
 */

export interface Category {
  id: string;
  name: string;
  category_type: 'income' | 'expense' | 'asset' | 'liability';
  tax_treatment: 'deductible' | 'non_deductible' | 'capital_allowance' | 'exempt';
  keywords: string[];
}

export interface CategorizationResult {
  categoryId: string | null;
  categoryName: string | null;
  confidenceScore: number; // 0-100
}

/**
 * Categorize a transaction based on its description
 */
export function categorizeTransaction(
  description: string,
  categories: Category[]
): CategorizationResult {
  if (!description || !categories.length) {
    return {
      categoryId: null,
      categoryName: null,
      confidenceScore: 0,
    };
  }
  
  const descLower = description.toLowerCase();
  let bestMatch: { category: Category; score: number } | null = null;
  
  for (const category of categories) {
    let matchScore = 0;
    let matchedKeywords = 0;
    
    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      if (descLower.includes(keywordLower)) {
        matchedKeywords++;
        
        // Exact match gets higher score
        if (descLower === keywordLower) {
          matchScore += 100;
        }
        // Match at start of description
        else if (descLower.startsWith(keywordLower)) {
          matchScore += 80;
        }
        // Match as whole word
        else if (new RegExp(`\\b${keywordLower}\\b`).test(descLower)) {
          matchScore += 60;
        }
        // Partial match
        else {
          matchScore += 40;
        }
      }
    }
    
    if (matchedKeywords > 0) {
      // Boost score for multiple keyword matches
      const finalScore = matchScore * (1 + (matchedKeywords - 1) * 0.2);
      
      if (!bestMatch || finalScore > bestMatch.score) {
        bestMatch = { category, score: finalScore };
      }
    }
  }
  
  if (!bestMatch) {
    return {
      categoryId: null,
      categoryName: null,
      confidenceScore: 0,
    };
  }
  
  // Normalize confidence score to 0-100 range
  const confidenceScore = Math.min(100, Math.round(bestMatch.score / 2));
  
  return {
    categoryId: bestMatch.category.id,
    categoryName: bestMatch.category.name,
    confidenceScore,
  };
}

/**
 * Categorize multiple transactions in bulk
 */
export function categorizeTransactions(
  transactions: Array<{ description: string }>,
  categories: Category[]
): CategorizationResult[] {
  return transactions.map(t => categorizeTransaction(t.description, categories));
}

/**
 * Get suggested category for manual review
 */
export function getSuggestedCategory(
  description: string,
  categories: Category[],
  minConfidence: number = 50
): CategorizationResult | null {
  const result = categorizeTransaction(description, categories);
  
  if (result.confidenceScore >= minConfidence) {
    return result;
  }
  
  return null;
}
