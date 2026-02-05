'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalculationDetailModal } from '@/components/CalculationDetailModal';
import { CalculationComparisonModal } from '@/components/CalculationComparisonModal';
import { useCalculationHistory } from '@/hooks/useCalculationHistory';
import { Trash2, Eye, Download, Search, Filter, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-exporter';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonCalcs, setComparisonCalcs] = useState<[CalculationHistory | null, CalculationHistory | null]>([null, null]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedIds.size} calculation(s)?`)) {
      for (const id of selectedIds) {
        await deleteCalculation(id);
      }
      setSelectedIds(new Set());
      setBulkDeleteMode(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id)));
    }
  };

  const handleComparisonSelect = (calc: CalculationHistory) => {
    if (!comparisonCalcs[0]) {
      setComparisonCalcs([calc, null]);
    } else if (!comparisonCalcs[1]) {
      setComparisonCalcs([comparisonCalcs[0], calc]);
      setShowComparisonModal(true);
      setComparisonMode(false);
    }
  };

  const resetComparison = () => {
    setComparisonCalcs([null, null]);
    setComparisonMode(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Calculation History</h1>
            <p className="text-muted-foreground">
              View and manage all your past tax calculations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportToExcel(data)}
              disabled={data.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
            <Button
              variant={comparisonMode ? 'default' : 'outline'}
              onClick={() => {
                if (comparisonMode) {
                  resetComparison();
                } else {
                  setComparisonMode(true);
                  setBulkDeleteMode(false);
                }
              }}
              disabled={data.length < 2}
            >
              {comparisonMode ? 'Exit Compare Mode' : 'Compare'}
            </Button>
            <Button
              variant={bulkDeleteMode ? 'default' : 'outline'}
              onClick={() => {
                if (bulkDeleteMode) {
                  setBulkDeleteMode(false);
                  setSelectedIds(new Set());
                } else {
                  setBulkDeleteMode(true);
                  setComparisonMode(false);
                }
              }}
            >
              {bulkDeleteMode ? 'Exit Bulk Mode' : 'Bulk Delete'}
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Mode Banner */}
      {comparisonMode && (
        <Card className="p-4 mb-6 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Comparison Mode Active</p>
              <p className="text-sm text-muted-foreground">
                {!comparisonCalcs[0] 
                  ? 'Select first calculation to compare'
                  : 'Select second calculation to compare'}
              </p>
              {comparisonCalcs[0] && (
                <p className="text-xs text-muted-foreground mt-1">
                  First: {getCalculatorName(comparisonCalcs[0].calculation_type)} - {formatDate(comparisonCalcs[0].created_at)}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetComparison}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Bulk Actions */}
      {bulkDeleteMode && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
              >
                {selectedIds.size === data.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkDeleteMode(false);
                  setSelectedIds(new Set());
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

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
                    {bulkDeleteMode && (
                      <th className="px-4 py-3 text-center text-sm font-medium w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === data.length && data.length > 0}
                          onChange={selectAll}
                          className="h-4 w-4"
                        />
                      </th>
                    )}
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
                      {bulkDeleteMode && (
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(calculation.id)}
                            onChange={() => toggleSelection(calculation.id)}
                            className="h-4 w-4"
                          />
                        </td>
                      )}
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
                      <td className="px-4 py-3 text-right space-x-2">
                        {comparisonMode ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComparisonSelect(calculation)}
                          >
                            Select
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(calculation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(calculation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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

      <CalculationComparisonModal
        calculation1={comparisonCalcs[0]}
        calculation2={comparisonCalcs[1]}
        open={showComparisonModal}
        onClose={() => {
          setShowComparisonModal(false);
          resetComparison();
        }}
      />
    </div>
  );
}
