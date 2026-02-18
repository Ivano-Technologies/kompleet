import { useState, useEffect, useCallback } from 'react';
import type {
  CalculationHistory,
  CalculationHistoryFilters,
  CalculationHistoryResponse,
} from '@/types/calculation-history';

export function useCalculationHistory(filters: CalculationHistoryFilters = {}) {
  const [data, setData] = useState<CalculationHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/history?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch calculation history');
      }

      const result: CalculationHistoryResponse = await response.json();
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [
    filters.type,
    filters.from,
    filters.to,
    filters.search,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteCalculation = async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete calculation');
      }

      // Refresh the list
      await fetchHistory();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  return {
    data,
    total,
    loading,
    error,
    refresh: fetchHistory,
    deleteCalculation,
  };
}
