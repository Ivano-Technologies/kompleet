'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator, Loader2 } from 'lucide-react';
import { useTaxRules } from '@/hooks/useTaxRules';
import { logCalculation } from '@/hooks/useAuditLog';

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

  // Fetch tax rules from database
  const { rules, loading: rulesLoading, error: rulesError } = useTaxRules('individual_income_tax');

  const calculateIndividualTax = () => {
    setError('');
    setResult(null);

    // Check if rules are loaded
    if (!rules) {
      setError('Tax rules are not loaded yet. Please wait...');
      return;
    }

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

    // Get tax brackets from database rules
    const TAX_BRACKETS = [
      {
        from: rules.tax_bracket_1?.value?.from || 0,
        to: rules.tax_bracket_1?.value?.to || 800_000,
        rate: (rules.tax_bracket_1?.value?.rate || 0) / 100,
      },
      {
        from: rules.tax_bracket_2?.value?.from || 800_001,
        to: rules.tax_bracket_2?.value?.to || 3_000_000,
        rate: (rules.tax_bracket_2?.value?.rate || 15) / 100,
      },
      {
        from: rules.tax_bracket_3?.value?.from || 3_000_001,
        to: rules.tax_bracket_3?.value?.to || 12_000_000,
        rate: (rules.tax_bracket_3?.value?.rate || 18) / 100,
      },
      {
        from: rules.tax_bracket_4?.value?.from || 12_000_001,
        to: rules.tax_bracket_4?.value?.to || 25_000_000,
        rate: (rules.tax_bracket_4?.value?.rate || 21) / 100,
      },
      {
        from: rules.tax_bracket_5?.value?.from || 25_000_001,
        to: rules.tax_bracket_5?.value?.to || 50_000_000,
        rate: (rules.tax_bracket_5?.value?.rate || 23) / 100,
      },
      {
        from: rules.tax_bracket_6?.value?.from || 50_000_001,
        to: rules.tax_bracket_6?.value?.to || null,
        rate: (rules.tax_bracket_6?.value?.rate || 25) / 100,
      },
    ];

    // Calculate deductions
    // Rent Relief: N500,000 OR 20% of annual rent paid (whichever is LOWER)
    const rentReliefCap = rules.rent_relief?.value?.cap || 500_000;
    const rentReliefPercentage = (rules.rent_relief?.value?.percentage || 20) / 100;
    const rentRelief = Math.min(rentReliefCap, rentPaidNum * rentReliefPercentage);

    // Owner-Occupier Interest: Fully deductible
    const totalDeductions = rentRelief + interestNum;

    // Taxable income
    const taxableIncome = Math.max(0, grossIncomeNum - totalDeductions);

    // Calculate tax using progressive brackets
    let remainingIncome = taxableIncome;
    let totalTax = 0;
    const bracketResults: TaxBracket[] = [];

    for (const bracket of TAX_BRACKETS) {
      if (remainingIncome <= 0) break;

      const bracketSize = bracket.to ? bracket.to - bracket.from + 1 : Infinity;
      const taxableInBracket = Math.min(remainingIncome, bracketSize);
      const taxOnBracket = taxableInBracket * bracket.rate;

      bracketResults.push({
        from: bracket.from,
        to: bracket.to,
        rate: bracket.rate * 100,
        taxableAmount: taxableInBracket,
        taxOnBracket,
      });

      totalTax += taxOnBracket;
      remainingIncome -= taxableInBracket;
    }

    const netIncome = grossIncomeNum - totalTax;
    const effectiveTaxRate = grossIncomeNum > 0 ? (totalTax / grossIncomeNum) * 100 : 0;

    const calculationResult = {
      grossIncome: grossIncomeNum,
      totalDeductions,
      taxableIncome,
      totalTax,
      netIncome,
      effectiveTaxRate,
      brackets: bracketResults,
    };

    setResult(calculationResult);

    // Log calculation for audit trail
    logCalculation(
      'individual_income_tax',
      {
        grossIncome: grossIncomeNum,
        rentPaid: rentPaidNum,
        ownerOccupierInterest: interestNum,
      },
      calculationResult
    ).catch(err => console.error('Failed to log calculation:', err));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Individual Tax Calculator</h1>
          <p className="text-muted-foreground">
            Calculate personal income tax under Nigeria Tax Act 2025
          </p>
        </div>

        {rulesError && (
          <Alert variant="destructive" className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Failed to load tax rules: {rulesError}. Using fallback rates.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Income & Deductions</CardTitle>
              <CardDescription>Enter your annual income and eligible deductions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income">Annual Gross Income (₦)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="e.g., 15000000"
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(e.target.value)}
                  disabled={rulesLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent">Annual Rent Paid (₦)</Label>
                <Input
                  id="rent"
                  type="number"
                  placeholder="e.g., 3000000"
                  value={rentPaid}
                  onChange={(e) => setRentPaid(e.target.value)}
                  disabled={rulesLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Relief: ₦{rules?.rent_relief?.value?.cap?.toLocaleString() || '500,000'} or{' '}
                  {rules?.rent_relief?.value?.percentage || 20}% of rent (whichever is lower)
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
                  disabled={rulesLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Interest on owner-occupier house loans is fully deductible
                </p>
              </div>

              <Button 
                onClick={calculateIndividualTax} 
                className="w-full"
                disabled={rulesLoading}
              >
                {rulesLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Rules...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Tax
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {result && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Gross Income:</span>
                      <span className="font-medium">{formatCurrency(result.grossIncome)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Total Deductions:</span>
                      <span className="font-medium">
                        -{formatCurrency(result.totalDeductions)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm border-t pt-2">
                      <span>Taxable Income:</span>
                      <span className="font-medium">{formatCurrency(result.taxableIncome)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total Tax:</span>
                      <span className="text-red-600">{formatCurrency(result.totalTax)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Net Income:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(result.netIncome)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Effective Tax Rate:</span>
                      <span>{result.effectiveTaxRate.toFixed(2)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tax Bracket Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.brackets.map((bracket, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between font-medium">
                            <span>
                              {formatCurrency(bracket.from)} -{' '}
                              {bracket.to ? formatCurrency(bracket.to) : 'Above'}
                            </span>
                            <span>{bracket.rate}%</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-xs">
                            <span>Taxable: {formatCurrency(bracket.taxableAmount)}</span>
                            <span>Tax: {formatCurrency(bracket.taxOnBracket)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!result && (
              <Card>
                <CardHeader>
                  <CardTitle>Tax Rates (2025)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span>First ₦800,000</span>
                      <span className="font-medium">0%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>₦800,001 - ₦3,000,000</span>
                      <span className="font-medium">15%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>₦3,000,001 - ₦12,000,000</span>
                      <span className="font-medium">18%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>₦12,000,001 - ₦25,000,000</span>
                      <span className="font-medium">21%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>₦25,000,001 - ₦50,000,000</span>
                      <span className="font-medium">23%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Above ₦50,000,000</span>
                      <span className="font-medium">25%</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About This Calculator</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This calculator implements the Nigeria Tax Act 2025 progressive tax rates for
              individuals. Tax rates and deduction limits are fetched dynamically from the KOMPLEET
              Tax Rules Engine.
            </p>
            <p>
              <strong>Data Source:</strong> Federal Inland Revenue Service (FIRS), validated by EY
              and KPMG analyses. Confidence level: {rules?.tax_bracket_1?.confidence || 'high'}.
            </p>
            <p>
              <strong>Disclaimer:</strong> This is an estimate. Consult a qualified Nigerian tax
              professional for personalized advice.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
