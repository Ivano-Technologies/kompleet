"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculationDetailModal } from "@/components/CalculationDetailModal";
import { CalculationComparisonModal } from "@/components/CalculationComparisonModal";
import { useCalculationHistory } from "@/hooks/useCalculationHistory";
import {
  Trash2,
  Eye,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Loader2,
  History,
} from "lucide-react";
import { exportToExcel } from "@/lib/excel-exporter";
import type { CalculationHistory } from "@/types/calculation-history";

export default function HistoryPage() {
  const [filters, setFilters] = useState({
    type: "",
    from: "",
    to: "",
    search: "",
    limit: 20,
    offset: 0,
  });

  const [selectedCalculation, setSelectedCalculation] =
    useState<CalculationHistory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonCalcs, setComparisonCalcs] = useState<
    [CalculationHistory | null, CalculationHistory | null]
  >([null, null]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const { data, total, loading, error, refresh, deleteCalculation } =
    useCalculationHistory(filters);

  const calculatorTypes = [
    { value: "", label: "All Calculators" },
    { value: "business_tax", label: "Business Tax" },
    { value: "individual_income_tax", label: "Individual Income Tax" },
    { value: "vat", label: "VAT" },
    { value: "capital_allowance", label: "Capital Allowances" },
    { value: "stamp_duty", label: "Stamp Duty" },
    { value: "property_tax", label: "Property Tax" },
  ];

  const dateRanges = [
    { value: "", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    let from = "";

    if (range === "today") {
      from = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    } else if (range === "week") {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      from = weekAgo.toISOString();
    } else if (range === "month") {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      from = monthAgo.toISOString();
    }

    setFilters((prev) => ({ ...prev, from, offset: 0 }));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this calculation?")) {
      await deleteCalculation(id);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.size} calculation(s)?`,
      )
    ) {
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
      setSelectedIds(new Set(data.map((d) => d.id)));
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
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCalculatorName = (type: string) => {
    const names: Record<string, string> = {
      business_tax: "Business Tax",
      individual_income_tax: "Individual Income Tax",
      vat: "VAT",
      capital_allowance: "Capital Allowances",
      stamp_duty: "Stamp Duty",
      property_tax: "Property Tax",
    };
    return names[type] || type;
  };

  const getTotalTax = (results: Record<string, any>) => {
    return results.total_tax || results.total || results.vat || 0;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 flex items-center gap-4">
        <div className="rounded-lg bg-light-background dark:bg-dark-background p-2">
          <History className="h-6 w-6 text-light-text-primary dark:text-dark-text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Calculation History
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            View and manage all your past tax calculations
          </p>
        </div>
      </header>

      <div className="mb-6 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => exportToExcel(data)}
          disabled={data.length === 0}
          className="btn-secondary"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
        <Button
          variant={comparisonMode ? "default" : "outline"}
          onClick={() => {
            if (comparisonMode) {
              resetComparison();
            } else {
              setComparisonMode(true);
              setBulkDeleteMode(false);
            }
          }}
          disabled={data.length < 2}
          className={comparisonMode ? "btn-primary" : "btn-secondary"}
        >
          {comparisonMode ? "Exit Compare Mode" : "Compare"}
        </Button>
        <Button
          variant={bulkDeleteMode ? "default" : "outline"}
          onClick={() => {
            if (bulkDeleteMode) {
              setBulkDeleteMode(false);
              setSelectedIds(new Set());
            } else {
              setBulkDeleteMode(true);
              setComparisonMode(false);
            }
          }}
          className={bulkDeleteMode ? "btn-primary" : "btn-secondary"}
        >
          {bulkDeleteMode ? "Exit Bulk Mode" : "Bulk Delete"}
        </Button>
      </div>

      {/* Comparison Mode Banner */}
      {comparisonMode && (
        <div className="p-4 mb-6 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                Comparison Mode Active
              </p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {!comparisonCalcs[0]
                  ? "Select first calculation to compare"
                  : "Select second calculation to compare"}
              </p>
              {comparisonCalcs[0] && (
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                  First:{" "}
                  {getCalculatorName(comparisonCalcs[0].calculation_type)} -{" "}
                  {formatDate(comparisonCalcs[0].created_at)}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetComparison}
              className="btn-secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {bulkDeleteMode && (
        <div className="p-4 mb-6 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="btn-secondary"
              >
                {selectedIds.size === data.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
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
                className="btn-secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Calculator Type Filter */}
          <div>
            <Label
              htmlFor="type-filter"
              className="text-light-text-secondary dark:text-dark-text-secondary"
            >
              Calculator Type
            </Label>
            <select
              id="type-filter"
              className="w-full mt-1 rounded-lg border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background px-3 py-2 text-light-text-primary dark:text-dark-text-primary"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
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
            <Label
              htmlFor="date-filter"
              className="text-light-text-secondary dark:text-dark-text-secondary"
            >
              Date Range
            </Label>
            <select
              id="date-filter"
              className="w-full mt-1 rounded-lg border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background px-3 py-2 text-light-text-primary dark:text-dark-text-primary"
              onChange={(e) => handleDateRangeChange(e.target.value)}
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div className="md:col-span-2">
            <Label
              htmlFor="search-filter"
              className="text-light-text-secondary dark:text-dark-text-secondary"
            >
              Search
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
              <Input
                id="search-filter"
                type="text"
                placeholder="Search by name or result..."
                className="pl-10 w-full rounded-lg border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}
      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* History Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
            <thead className="bg-light-background dark:bg-dark-background">
              <tr>
                {bulkDeleteMode && (
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light-text-primary dark:text-dark-text-primary sm:pl-6"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-light-border dark:border-dark-border"
                      onChange={selectAll}
                      checked={
                        selectedIds.size === data.length && data.length > 0
                      }
                    />
                  </th>
                )}
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light-text-primary dark:text-dark-text-primary sm:pl-6"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-light-text-primary dark:text-dark-text-primary"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-light-text-primary dark:text-dark-text-primary"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-light-text-primary dark:text-dark-text-primary"
                >
                  Total Tax
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border bg-light-surface dark:bg-dark-surface">
              {data.map((calc) => (
                <tr
                  key={calc.id}
                  className={`${(comparisonMode || bulkDeleteMode) && selectedIds.has(calc.id) ? "bg-primary-500/10" : ""}`}
                >
                  {bulkDeleteMode && (
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-light-text-primary dark:text-dark-text-primary sm:pl-6">
                      <input
                        type="checkbox"
                        className="rounded border-light-border dark:border-dark-border"
                        checked={selectedIds.has(calc.id)}
                        onChange={() => toggleSelection(calc.id)}
                      />
                    </td>
                  )}
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-light-text-primary dark:text-dark-text-primary sm:pl-6">
                    {formatDate(calc.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {getCalculatorName(calc.calculation_type)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {calc.calculation_type || "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {formatCurrency(getTotalTax(calc.results))}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {comparisonMode ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComparisonSelect(calc)}
                        disabled={
                          !!comparisonCalcs[1] ||
                          comparisonCalcs[0]?.id === calc.id
                        }
                        className="btn-secondary"
                      >
                        Select
                      </Button>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(calc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(calc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && data.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-dashed border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            No calculation history found.
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && total > filters.limit && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Showing {filters.offset + 1} to{" "}
            {Math.min(filters.offset + filters.limit, total)} of {total} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  offset: Math.max(0, prev.offset - prev.limit),
                }))
              }
              disabled={filters.offset === 0}
              className="btn-secondary"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  offset: prev.offset + prev.limit,
                }))
              }
              disabled={filters.offset + filters.limit >= total}
              className="btn-secondary"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
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
