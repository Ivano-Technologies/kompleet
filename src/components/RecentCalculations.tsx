"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CalculationHistory } from "@/types/calculation-history";

export function RecentCalculations() {
  const [calculations, setCalculations] = useState<CalculationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentCalculations();
  }, []);

  const fetchRecentCalculations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/history?limit=5&offset=0");

      if (!response.ok) {
        throw new Error("Failed to fetch recent calculations");
      }

      const result = await response.json();
      setCalculations(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCalculatorName = (type: string) => {
    const names: Record<string, string> = {
      business_tax: "Business Tax",
      individual_income_tax: "Individual Tax",
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (calculations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No calculations yet. Start by using one of our tax calculators!
          </p>
          <Link href="/calculators/business-tax">
            <Button variant="outline" size="sm">
              Try Business Tax Calculator
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Calculations</CardTitle>
        <Link href="/history">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {calculations.map((calc) => (
            <div
              key={calc.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {getCalculatorName(calc.calculation_type)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(calc.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600">
                  {formatCurrency(getTotalTax(calc.results))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
