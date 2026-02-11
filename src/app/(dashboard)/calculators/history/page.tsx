'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, FileText, Trash2, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TaxCalculation {
  id: string;
  tax_type: 'pit' | 'cit' | 'vat' | 'wht';
  tax_year: number;
  calculation_date: string;
  gross_amount: number;
  deductions: number;
  taxable_amount: number;
  tax_due: number;
  effective_rate: number | null;
  is_final: boolean;
  created_at: string;
}

const TAX_TYPE_LABELS = {
  pit: 'Personal Income Tax',
  cit: 'Company Income Tax',
  vat: 'VAT Compliance',
  wht: 'Withholding Tax',
};

export default function CalculationHistoryPage() {
  const [calculations, setCalculations] = useState<TaxCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pit' | 'cit' | 'vat' | 'wht'>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchCalculations();
  }, [filter, yearFilter]);

  const fetchCalculations = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('tax_type', filter);
      if (yearFilter !== 'all') params.append('tax_year', yearFilter.toString());

      const response = await fetch(`/api/calculations?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch calculations');
      }

      setCalculations(data.calculations || []);
    } catch (err: any) {
      console.error('[Fetch Calculations Error]', err);
      setError(err.message || 'Failed to load calculations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calculation?')) return;

    try {
      const response = await fetch(`/api/calculations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete');
      }

      // Refresh list
      fetchCalculations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete calculation');
    }
  };

  const formatCurrency = (amountInKobo: number) => {
    const naira = amountInKobo / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(naira);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const availableYears = Array.from(
    new Set(calculations.map((calc) => calc.tax_year))
  ).sort((a, b) => b - a);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Calculation History</h1>
          <p className="text-muted-foreground">
            View, manage, and export your saved tax calculations
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Tax Type</label>
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'pit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pit')}
                  >
                    PIT
                  </Button>
                  <Button
                    variant={filter === 'cit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('cit')}
                  >
                    CIT
                  </Button>
                  <Button
                    variant={filter === 'vat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('vat')}
                  >
                    VAT
                  </Button>
                </div>
              </div>

              {availableYears.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Tax Year</label>
                  <select
                    value={yearFilter}
                    onChange={(e) =>
                      setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
                    }
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && calculations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No calculations found</h3>
              <p className="text-muted-foreground mb-6">
                You haven't saved any calculations yet. Use the calculators to create and save your tax calculations.
              </p>
              <Link href="/calculators">
                <Button>Go to Tax Calculators</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Calculations List */}
        {!loading && !error && calculations.length > 0 && (
          <div className="space-y-4">
            {calculations.map((calc) => (
              <Card key={calc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {TAX_TYPE_LABELS[calc.tax_type]}
                      </CardTitle>
                      <CardDescription>
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {formatDate(calc.calculation_date)} • Tax Year {calc.tax_year}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {calc.is_final && (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" />
                          Finalized
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Gross Amount</div>
                      <div className="font-medium">{formatCurrency(calc.gross_amount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxable Amount</div>
                      <div className="font-medium">{formatCurrency(calc.taxable_amount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tax Due</div>
                      <div className="font-medium text-primary">{formatCurrency(calc.tax_due)}</div>
                    </div>
                    {calc.effective_rate && (
                      <div>
                        <div className="text-sm text-muted-foreground">Effective Rate</div>
                        <div className="font-medium">{calc.effective_rate.toFixed(2)}%</div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/calculators/history/${calc.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {!calc.is_final && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(calc.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
