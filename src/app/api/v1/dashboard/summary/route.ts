import { NextRequest } from 'next/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api';
import type { DashboardSummary } from '@/types/api';

/**
 * GET /api/v1/dashboard/summary
 * Get dashboard summary statistics
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('userId' in authResult === false) {
    return authResult;
  }
  const { userId } = authResult;

  try {
    // TODO: Replace with actual database aggregations
    const mockSummary: DashboardSummary = {
      totalIncome: 450000,
      totalExpenses: 180000,
      netIncome: 270000,
      vatCollected: 33750,
      vatPaid: 13500,
      pendingFilings: 2,
      recentRecords: [
        {
          id: '1',
          userId,
          type: 'income',
          amount: 150000,
          currency: 'NGN',
          date: '2026-02-01',
          category: 'Sales',
          description: 'Product sales - January',
          taxCode: 'VAT-001',
          vatAmount: 11250,
          createdAt: '2026-02-01T10:00:00Z',
          updatedAt: '2026-02-01T10:00:00Z',
        },
        {
          id: '2',
          userId,
          type: 'expense',
          amount: 50000,
          currency: 'NGN',
          date: '2026-02-03',
          category: 'Office Supplies',
          description: 'Stationery and equipment',
          taxCode: 'VAT-002',
          vatAmount: 3750,
          createdAt: '2026-02-03T14:30:00Z',
          updatedAt: '2026-02-03T14:30:00Z',
        },
      ],
      monthlyTrend: [
        { month: '2025-12', income: 400000, expenses: 150000 },
        { month: '2026-01', income: 450000, expenses: 180000 },
        { month: '2026-02', income: 300000, expenses: 120000 },
      ],
    };

    return apiSuccess(mockSummary);
  } catch (error) {
    console.error('GET /api/v1/dashboard/summary error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch dashboard summary', 500);
  }
}
