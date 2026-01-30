/**
 * Supabase Queries Tests
 * ======================
 * Tests for database query functions using mocked Supabase client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TypedSupabaseClient } from '../client';
import {
  getCategories,
  getTransactions,
  getProfile,
  getTransactionTotals,
  getDashboardSummary,
} from '../queries';

/**
 * Creates a mock Supabase client for testing.
 */
function createMockClient(overrides: Record<string, unknown> = {}): TypedSupabaseClient {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    ...overrides,
  };

  return {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => mockQuery),
  } as unknown as TypedSupabaseClient;
}

describe('Supabase Queries', () => {
  describe('getCategories', () => {
    it('should return categories on success', async () => {
      const mockCategories = [
        { id: '1', name: 'Salary', category_group: 'income' },
        { id: '2', name: 'Rent', category_group: 'expense' },
      ];

      const mockClient = createMockClient();
      const mockFrom = mockClient.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCategories,
          error: null,
        }),
      });

      const result = await getCategories(mockClient);

      expect(result.data).toEqual(mockCategories);
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('categories');
    });

    it('should return empty array on error', async () => {
      const mockClient = createMockClient();
      const mockFrom = mockClient.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const result = await getCategories(mockClient);

      expect(result.data).toEqual([]);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getProfile', () => {
    it('should return profile on success', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        entity_type: 'individual',
      };

      const mockClient = createMockClient();
      const mockFrom = mockClient.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      const result = await getProfile(mockClient, 'user-123');

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('should return null on error', async () => {
      const mockClient = createMockClient();
      const mockFrom = mockClient.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      });

      const result = await getProfile(mockClient, 'invalid-id');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Not found');
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const mockTransactions = [
        { id: '1', description: 'Payment', amount: 100000, transaction_type: 'credit' },
        { id: '2', description: 'Purchase', amount: 50000, transaction_type: 'debit' },
      ];

      const mockClient = createMockClient();
      const mockFrom = mockClient.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockTransactions,
          count: 2,
          error: null,
        }),
      });

      const result = await getTransactions(mockClient, {
        taxYear: 2024,
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(mockTransactions);
      expect(result.count).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should apply filters correctly', async () => {
      const mockClient = createMockClient();
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };
      (mockClient.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      await getTransactions(mockClient, {
        taxYear: 2024,
        transactionType: 'credit',
        search: 'salary',
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('tax_year', 2024);
      expect(mockQuery.eq).toHaveBeenCalledWith('transaction_type', 'credit');
      expect(mockQuery.ilike).toHaveBeenCalledWith('description', '%salary%');
    });

    it('should return empty result on error', async () => {
      const mockClient = createMockClient();
      const mockFrom = mockClient.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          count: null,
          error: { message: 'Query failed' },
        }),
      });

      const result = await getTransactions(mockClient);

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.error).toBe('Query failed');
    });
  });

  describe('getTransactionTotals', () => {
    it('should calculate income and expenses correctly', async () => {
      const mockTransactions = [
        { amount: 100000, transaction_type: 'credit' },
        { amount: 50000, transaction_type: 'credit' },
        { amount: 30000, transaction_type: 'debit' },
        { amount: 20000, transaction_type: 'debit' },
      ];

      const mockClient = createMockClient();
      const mockFrom = mockClient.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      });

      const result = await getTransactionTotals(mockClient, 2024);

      expect(result.data?.income).toBe(150000); // 100000 + 50000
      expect(result.data?.expenses).toBe(50000); // 30000 + 20000
      expect(result.data?.count).toBe(4);
      expect(result.error).toBeNull();
    });
  });

  describe('getDashboardSummary', () => {
    it('should aggregate dashboard data', async () => {
      const mockClient = createMockClient();
      const mockFrom = mockClient.from as ReturnType<typeof vi.fn>;

      // Mock for getTransactionTotals
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        
        if (table === 'transactions' && callCount === 1) {
          // getTransactionTotals
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({
              data: [
                { amount: 100000, transaction_type: 'credit' },
                { amount: 50000, transaction_type: 'debit' },
              ],
              error: null,
            }),
          };
        }
        
        if (table === 'transactions' && callCount === 2) {
          // getUncategorizedCount
          return {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          };
        }
        
        // getTransactions
        return {
          select: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [],
            count: 0,
            error: null,
          }),
        };
      });

      const result = await getDashboardSummary(mockClient, 2024);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });
});
