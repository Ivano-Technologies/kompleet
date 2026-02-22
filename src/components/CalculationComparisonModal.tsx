"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CalculationHistory } from "@/types/calculation-history";

interface CalculationComparisonModalProps {
  calculation1: CalculationHistory | null;
  calculation2: CalculationHistory | null;
  open: boolean;
  onClose: () => void;
}

export function CalculationComparisonModal({
  calculation1,
  calculation2,
  open,
  onClose,
}: CalculationComparisonModalProps) {
  if (!calculation1 || !calculation2) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
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

  const formatValue = (value: any): string => {
    if (typeof value === "number") {
      return formatCurrency(value);
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (value === null || value === undefined) {
      return "N/A";
    }
    return String(value);
  };

  const formatLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getTotalTax = (results: Record<string, any>) => {
    return (
      results.total_tax ||
      results.total ||
      results.vat ||
      results.stamp_duty ||
      results.wht_amount ||
      0
    );
  };

  const difference =
    getTotalTax(calculation2.results) - getTotalTax(calculation1.results);
  const percentChange =
    getTotalTax(calculation1.results) !== 0
      ? ((difference / getTotalTax(calculation1.results)) * 100).toFixed(2)
      : "N/A";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Calculation Comparison</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Comparison Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tax Difference:</p>
              <p
                className={`font-semibold ${difference >= 0 ? "text-red-600" : "text-green-600"}`}
              >
                {difference >= 0 ? "+" : ""}
                {formatCurrency(difference)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Percentage Change:</p>
              <p
                className={`font-semibold ${difference >= 0 ? "text-red-600" : "text-green-600"}`}
              >
                {percentChange !== "N/A"
                  ? `${difference >= 0 ? "+" : ""}${percentChange}%`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Calculator Match:</p>
              <p className="font-semibold">
                {calculation1.calculation_type === calculation2.calculation_type
                  ? "✓ Same"
                  : "✗ Different"}
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-6">
          {/* Calculation 1 */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Calculation 1</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {getCalculatorName(calculation1.calculation_type)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(calculation1.created_at)}
              </p>
            </div>

            {/* Inputs */}
            <div>
              <h4 className="font-medium mb-2 text-sm">Inputs</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {Object.entries(calculation1.inputs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatLabel(key)}:
                    </span>
                    <span className="font-medium">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div>
              <h4 className="font-medium mb-2 text-sm">Results</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                {Object.entries(calculation1.results).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatLabel(key)}:
                    </span>
                    <span className="font-semibold">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calculation 2 */}
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Calculation 2</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {getCalculatorName(calculation2.calculation_type)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(calculation2.created_at)}
              </p>
            </div>

            {/* Inputs */}
            <div>
              <h4 className="font-medium mb-2 text-sm">Inputs</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {Object.entries(calculation2.inputs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatLabel(key)}:
                    </span>
                    <span className="font-medium">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div>
              <h4 className="font-medium mb-2 text-sm">Results</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                {Object.entries(calculation2.results).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatLabel(key)}:
                    </span>
                    <span className="font-semibold">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
