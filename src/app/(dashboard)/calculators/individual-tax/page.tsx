'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator } from 'lucide-react';

interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  taxOnBracket: number;
}

interface IndividualTaxResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTax: number;
  netIncome: number;
  effectiveTaxRate: number;
  brackets: TaxBracket[];
}

export default function IndividualTaxCalculatorPage() {
  const [grossIncome, setGrossIncome] = useState<string>('');
  const [rentPaid, setRentPaid] = useState<string>('');
  const [ownerOccupierInterest, setOwnerOccupierInterest] = useState<string>('');
  const [result, setResult] = useState<IndividualTaxResult | null>(null);
  const [error, setError] = useState<string>('');

  // Nigeria Tax Act 2025 - Personal Income Tax Rates
  const TAX_BRACKETS = [
    { from: 0, to: 800_000, rate: 0 },
    { from: 800_001, to: 3_000_000, rate: 0.15 },
    { from: 3_000_001, to: 12_000_000, rate: 0.18 },
    { from: 12_000_001, to: 25_000_000, rate: 0.21 },
    { from: 25_000_001, to: 50_000_000, rate: 0.23 },
    { from: 50_000_001, to: null, rate: 0.25 },
  ];

  const calculateIndividualTax = () => {
    setError('');
    setResult(null);

    // Validation
    const grossIncomeNum = parseFloat(grossIncome);
    const rentPaidNum = parseFloat(rentPaid || '0');
    const interestNum = parseFloat(ownerOccupierInterest || '0');

    if (isNaN(grossIncomeNum) || grossIncomeNum < 0) {
      setError('Please enter a valid gross income amount');
      return;
    }

    if (isNaN(rentPaidNum) || rentPaidNum < 0) {
      setError('Please enter a valid rent amount');
      return;
    }

    if (isNaN(interestNum) || interestNum < 0) {
      setError('Please enter a valid interest amount');
      return;
    }

    // Calculate deductions
    // Rent Relief: N500,000 OR 20% of annual rent paid (whichever is LOWER)
    const rentRelief = Math.min(500_000, rentPaidNum * 0.2);

    // Owner-Occupier Interest: Fully deductible
    const totalDeductions = rentRelief + interestNum;

    // Taxable income
    const taxableIncome = Math.max(0, grossIncomeNum - totalDeductions);

    // Calculate tax using progressive brackets
    let remainingIncome = taxableIncome;
    let totalTax = 0;
    const bracketDetails: TaxBracket[] = [];

    for (const bracket of TAX_BRACKETS) {
      if (remainingIncome <= 0) break;

      const bracketSize = bracket.to ? bracket.to - bracket.from + 1 : Infinity;
      const taxableInBracket = Math.min(remainingIncome, bracketSize);
      const taxOnBracket = taxableInBracket * bracket.rate;

      bracketDetails.push({
        from: bracket.from,
        to: bracket.to,
        rate: bracket.rate,
        taxableAmount: taxableInBracket,
        taxOnBracket,
      });

      totalTax += taxOnBracket;
      remainingIncome -= taxableInBracket;
    }

    const netIncome = grossIncomeNum - totalTax;
    const effectiveTaxRate = grossIncomeNum > 0 ? (totalTax / grossIncomeNum) * 100 : 0;

    setResult({
      grossIncome: grossIncomeNum,
      totalDeductions,
      taxableIncome,
      totalTax,
      netIncome,
      effectiveTaxRate,
      brackets: bracketDetails,
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatBracketRange = (from: number, to: number | null): string => {
    if (to === null) {
      return `Above ${formatCurrency(from)}`;
    }
    return `${formatCurrency(from)} - ${formatCurrency(to)}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Individual Tax Calculator</h1>
        <p className="text-muted-foreground">
          Calculate personal income tax under the Nigeria Tax Act 2025 progressive rate system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Income & Deductions</CardTitle>
            <CardDescription>Enter your annual income and deductible expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grossIncome">Annual Gross Income (₦)</Label>
              <Input
                id="grossIncome"
                type="number"
                placeholder="e.g., 15000000"
                value={grossIncome}
                onChange={(e) => setGrossIncome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentPaid">Annual Rent Paid (₦)</Label>
              <Input
                id="rentPaid"
                type="number"
                placeholder="e.g., 3000000"
                value={rentPaid}
                onChange={(e) => setRentPaid(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Relief: ₦500,000 OR 20% of rent (whichever is lower)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest">Owner-Occupier Interest (₦)</Label>
              <Input
                id="interest"
                type="number"
                placeholder="e.g., 500000"
                value={ownerOccupierInterest}
                onChange={(e) => setOwnerOccupierInterest(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Interest on owner-occupier house loan</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={calculateIndividualTax} className="w-full" size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Tax
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Gross Income</span>
                      <span className="font-semibold">{formatCurrency(result.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Total Deductions</span>
                      <span className="font-semibold text-green-600">-{formatCurrency(result.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Taxable Income</span>
                      <span className="font-semibold">{formatCurrency(result.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg mt-2">
                      <span className="font-bold">Total Tax Due</span>
                      <span className="font-bold text-lg text-red-600">{formatCurrency(result.totalTax)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-lg">
                      <span className="font-bold">Net Income</span>
                      <span className="font-bold text-lg text-green-600">{formatCurrency(result.netIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Effective Tax Rate</span>
                      <span className="text-sm font-medium">{result.effectiveTaxRate.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Enter income details and click Calculate Tax to see results</p>
                </div>
              )}
            </CardContent>
          </Card>

          {result && result.brackets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tax Bracket Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.brackets.map((bracket, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{formatBracketRange(bracket.from, bracket.to)}</span>
                        <span className="text-sm font-semibold">{(bracket.rate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{formatCurrency(bracket.taxableAmount)} taxable</span>
                        <span className="font-medium text-foreground">{formatCurrency(bracket.taxOnBracket)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5" />
                Tax Rates (2025)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <p className="font-semibold mb-2">Progressive Tax Brackets:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex justify-between">
                    <span>First ₦800,000</span>
                    <span className="font-medium">0%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>₦800,001 - ₦3,000,000</span>
                    <span className="font-medium">15%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>₦3,000,001 - ₦12,000,000</span>
                    <span className="font-medium">18%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>₦12,000,001 - ₦25,000,000</span>
                    <span className="font-medium">21%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>₦25,000,001 - ₦50,000,000</span>
                    <span className="font-medium">23%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Above ₦50,000,000</span>
                    <span className="font-medium">25%</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Source: Nigeria Tax Act 2025 | Last reviewed: Feb 4, 2026
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
