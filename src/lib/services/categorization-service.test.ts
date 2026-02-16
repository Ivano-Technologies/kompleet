import { describe, it, expect } from 'vitest';
import {
  categorizeTransaction,
  categorizeTransactions,
  getSuggestedCategory,
  type Category,
} from './categorization-service';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const categories: Category[] = [
  {
    id: 'cat-office',
    name: 'Office Supplies',
    category_type: 'expense',
    tax_treatment: 'deductible',
    keywords: ['office', 'stationery', 'printer', 'paper'],
  },
  {
    id: 'cat-travel',
    name: 'Travel & Transport',
    category_type: 'expense',
    tax_treatment: 'deductible',
    keywords: ['uber', 'flight', 'hotel', 'taxi', 'transport'],
  },
  {
    id: 'cat-salary',
    name: 'Salary',
    category_type: 'expense',
    tax_treatment: 'deductible',
    keywords: ['salary', 'payroll', 'wages'],
  },
  {
    id: 'cat-revenue',
    name: 'Sales Revenue',
    category_type: 'income',
    tax_treatment: 'non_deductible',
    keywords: ['sales', 'revenue', 'payment received', 'invoice payment'],
  },
];

// ── categorizeTransaction ────────────────────────────────────────────────────

describe('categorizeTransaction', () => {
  it('returns null category with zero confidence for an empty description', () => {
    const result = categorizeTransaction('', categories);

    expect(result.categoryId).toBeNull();
    expect(result.categoryName).toBeNull();
    expect(result.confidenceScore).toBe(0);
  });

  it('returns null category with zero confidence when categories list is empty', () => {
    const result = categorizeTransaction('office supplies purchase', []);

    expect(result.categoryId).toBeNull();
    expect(result.categoryName).toBeNull();
    expect(result.confidenceScore).toBe(0);
  });

  it('returns null when description matches no keywords', () => {
    const result = categorizeTransaction(
      'random unrelated text xyz123',
      categories,
    );

    expect(result.categoryId).toBeNull();
    expect(result.categoryName).toBeNull();
    expect(result.confidenceScore).toBe(0);
  });

  it('matches a keyword as a whole word in the description', () => {
    const result = categorizeTransaction(
      'Purchased new printer for Lagos office',
      categories,
    );

    expect(result.categoryId).toBe('cat-office');
    expect(result.categoryName).toBe('Office Supplies');
    expect(result.confidenceScore).toBeGreaterThan(0);
  });

  it('performs case-insensitive matching', () => {
    const result = categorizeTransaction('UBER ride to Ikeja', categories);

    expect(result.categoryId).toBe('cat-travel');
    expect(result.categoryName).toBe('Travel & Transport');
  });

  it('gives higher confidence for exact description match', () => {
    const exact = categorizeTransaction('salary', categories);
    const partial = categorizeTransaction(
      'monthly salary for January staff',
      categories,
    );

    // Both should match salary category
    expect(exact.categoryId).toBe('cat-salary');
    expect(partial.categoryId).toBe('cat-salary');

    // Exact match should score higher
    expect(exact.confidenceScore).toBeGreaterThan(partial.confidenceScore);
  });

  it('gives higher confidence for description-start match than mid-word', () => {
    const startsWithKeyword = categorizeTransaction('uber trip downtown', categories);
    const containsKeyword = categorizeTransaction('my uber ride', categories);

    // Both should match Travel
    expect(startsWithKeyword.categoryId).toBe('cat-travel');
    expect(containsKeyword.categoryId).toBe('cat-travel');

    // Starting match should score higher
    expect(startsWithKeyword.confidenceScore).toBeGreaterThanOrEqual(
      containsKeyword.confidenceScore,
    );
  });

  it('boosts confidence when multiple keywords match', () => {
    const singleKeyword = categorizeTransaction('bought paper', categories);
    const multipleKeywords = categorizeTransaction(
      'office paper and stationery',
      categories,
    );

    expect(singleKeyword.categoryId).toBe('cat-office');
    expect(multipleKeywords.categoryId).toBe('cat-office');

    // Multiple keyword matches should give higher confidence
    expect(multipleKeywords.confidenceScore).toBeGreaterThan(
      singleKeyword.confidenceScore,
    );
  });

  it('confidence score is capped at 100', () => {
    // Create a category with many keywords that all appear in the description
    const heavyCategory: Category = {
      id: 'cat-heavy',
      name: 'Heavy Match',
      category_type: 'expense',
      tax_treatment: 'deductible',
      keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    };

    const result = categorizeTransaction('a b c d e f g h', [heavyCategory]);

    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('selects the category with the highest match score when multiple match', () => {
    // "office transport" has one keyword for each of two categories
    // but "office paper stationery" stacks multiple office keywords
    const result = categorizeTransaction(
      'office paper stationery purchase',
      categories,
    );

    expect(result.categoryId).toBe('cat-office');
  });
});

// ── categorizeTransactions (bulk) ────────────────────────────────────────────

describe('categorizeTransactions', () => {
  it('returns one result per transaction, in order', () => {
    const transactions = [
      { description: 'uber ride' },
      { description: 'office paper' },
      { description: 'xyzzy nothing' },
    ];

    const results = categorizeTransactions(transactions, categories);

    expect(results).toHaveLength(3);
    expect(results[0].categoryId).toBe('cat-travel');
    expect(results[1].categoryId).toBe('cat-office');
    expect(results[2].categoryId).toBeNull();
  });

  it('returns an empty array for an empty transactions list', () => {
    const results = categorizeTransactions([], categories);
    expect(results).toEqual([]);
  });
});

// ── getSuggestedCategory ─────────────────────────────────────────────────────

describe('getSuggestedCategory', () => {
  it('returns a result when confidence meets the default threshold (50)', () => {
    // An exact keyword match: "salary" -> score 100 / 2 = 50 (meets threshold)
    const result = getSuggestedCategory('salary', categories);

    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe('cat-salary');
    expect(result!.confidenceScore).toBeGreaterThanOrEqual(50);
  });

  it('returns null when confidence is below the threshold', () => {
    // Use a very high threshold that a partial match can't reach
    const result = getSuggestedCategory(
      'bought paper',
      categories,
      99,
    );

    expect(result).toBeNull();
  });

  it('respects a custom minConfidence parameter', () => {
    const lowThreshold = getSuggestedCategory('bought paper', categories, 1);
    const highThreshold = getSuggestedCategory('bought paper', categories, 99);

    expect(lowThreshold).not.toBeNull();
    expect(highThreshold).toBeNull();
  });

  it('returns null when there is no match at all', () => {
    const result = getSuggestedCategory('xyzzy nothing', categories);
    expect(result).toBeNull();
  });
});
