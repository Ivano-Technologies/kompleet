'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalculationDetailModal } from '@/components/CalculationDetailModal';
import { useCalculationHistory } from '@/hooks/useCalculationHistory';
import { Trash2, Eye, Download, Search, Filter } from 'lucide-react';
import type { CalculationHistory } from '@/types/calculation-history';

export default function HistoryPage() {
  const [filters, setFilters] = useState({
    type: '',
    from: '',
    to: '',
    search: '',
    limit: 20,
    offset: 0,
  });

  const [selectedCalculation, setSelectedCalculation] =
    useState<CalculationHistory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data, total, loading, error, refresh, deleteCalculation } =
    useCalculationHistory(filters);

  const calculatorTypes = [
    { value: '', label: 'All Calculators' },
    { value: 'business_tax', label: 'Business Tax' },
    { value: 'individual_income_tax', label: 'Individual Income Tax' },
    { value: 'vat', label: 'VAT' },
    { value: 'capital_allowance', label: 'Capital Allowances' },
    { value: 'stamp_duty', label: 'Stamp Duty' },
    { value: 'property_tax', label: 'Property Tax' },
  ];

  const dateRanges = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    let from = '';

    if (range === 'today') {
      from = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    } else if (range === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      from = weekAgo.toISOString();
    } else if (range === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      from = monthAgo.toISOString();
    }

    setFilters((prev) => ({ ...prev, from, offset: 0 }));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this calculation?')) {
      await deleteCalculation(id);
    }
  };

  const handleViewDetail = (calculation: CalculationHistory) => {
    setSelectedCalculation(calculation);
    setShowDetailModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCalculatorName = (type: string) => {
    const names: Record<string, string> = {
      business_tax: 'Business Tax',
      individual_income_tax: 'Individual Income Tax',
      vat: 'VAT',
      capital_allowance: 'Capital Allowances',
      stamp_duty: 'Stamp Duty',
      property_tax: 'Property Tax',
    };
    return names[type] || type;
  };

  const getTotalTax = (results: Record<string, any>) => {
    return results.total_tax || results.total || results.vat || 0;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Calculation History</h1>
        <p className="text-muted-foreground">
          View and manage all your past tax calculations
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Calculator Type Filter */}
          <div>
            <Label htmlFor="type-filter">Calculator Type</Label>
            <select
              id="type-filter"
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              {calculatorTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <Label htmlFor="date-filter">Date Range</Label>
            <select
              id="date-filter"
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
              onChange={(e) => handleDateRangeChange(e.target.value)}
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by amount..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading calculations...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              No calculations found. Start by using one of our calculators!
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Calculator
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Tax
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((calculation) => (
                    <tr key={calculation.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(calculation.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getCalculatorName(calculation.calculation_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(
                          calculation.inputs.turnover ||
                            calculation.inputs.income ||
                            calculation.inputs.amount ||
                            calculation.inputs.asset_cost ||
                            0
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(getTotalTax(calculation.results))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(calculation)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(calculation.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filters.offset + 1} to{' '}
                {Math.min(filters.offset + filters.limit, total)} of {total}{' '}
                calculations
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.offset === 0}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      offset: Math.max(0, prev.offset - prev.limit),
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.offset + filters.limit >= total}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      offset: prev.offset + prev.limit,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <CalculationDetailModal
        calculation={selectedCalculation}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
}
