'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator } from 'lucide-react';

interface BusinessTaxResult {
  isSmallCompany: boolean;
  corporateTax: number;
  developmentLevy: number;
  totalTax: number;
  effectiveTaxRate: number;
  breakdown: {
    assessableProfit: number;
    corporateTaxRate: number;
    developmentLevyRate: number;
  };
}

export default function BusinessTaxCalculatorPage() {
  const [turnover, setTurnover] = useState<string>('');
  const [totalAssets, setTotalAssets] = useState<string>('');
  const [assessableProfit, setAssessableProfit] = useState<string>('');
  const [isProfessionalService, setIsProfessionalService] = useState<boolean>(false);
  const [result, setResult] = useState<BusinessTaxResult | null>(null);
  const [error, setError] = useState<string>('');

  const calculateBusinessTax = () => {
    setError('');
    setResult(null);

    // Validation
    const turnoverNum = parseFloat(turnover);
    const assetsNum = parseFloat(totalAssets);
    const profitNum = parseFloat(assessableProfit);

    if (isNaN(turnoverNum) || turnoverNum < 0) {
      setError('Please enter a valid turnover amount');
      return;
    }

    if (isNaN(assetsNum) || assetsNum < 0) {
      setError('Please enter a valid total assets amount');
      return;
    }

    if (isNaN(profitNum) || profitNum < 0) {
      setError('Please enter a valid assessable profit amount');
      return;
    }

    // Small Company Classification
    // Criteria: Turnover ≤ N50M AND Total Assets ≤ N250M AND NOT professional service
    const SMALL_COMPANY_TURNOVER_THRESHOLD = 50_000_000;
    const SMALL_COMPANY_ASSETS_THRESHOLD = 250_000_000;

    const isSmallCompany =
      turnoverNum <= SMALL_COMPANY_TURNOVER_THRESHOLD &&
      assetsNum <= SMALL_COMPANY_ASSETS_THRESHOLD &&
      !isProfessionalService;

    let corporateTax = 0;
    let developmentLevy = 0;
    let corporateTaxRate = 0;
    let developmentLevyRate = 0;

    if (isSmallCompany) {
      // Small companies: 0% tax, exempt from development levy
      corporateTaxRate = 0;
      developmentLevyRate = 0;
      corporateTax = 0;
      developmentLevy = 0;
    } else {
      // Other companies: 30% corporate tax + 4% development levy
      corporateTaxRate = 0.30;
      developmentLevyRate = 0.04;
      corporateTax = profitNum * corporateTaxRate;
      developmentLevy = profitNum * developmentLevyRate;
    }

    const totalTax = corporateTax + developmentLevy;
    const effectiveTaxRate = profitNum > 0 ? (totalTax / profitNum) * 100 : 0;

    setResult({
      isSmallCompany,
      corporateTax,
      developmentLevy,
      totalTax,
      effectiveTaxRate,
      breakdown: {
        assessableProfit: profitNum,
        corporateTaxRate: corporateTaxRate * 100,
        developmentLevyRate: developmentLevyRate * 100,
      },
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-NG').format(num);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Business Tax Calculator</h1>
        <p className="text-muted-foreground">
          Calculate corporate income tax and development levy under the Nigeria Tax Act 2025
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Enter your company's financial details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="turnover">Annual Turnover (₦)</Label>
              <Input
                id="turnover"
                type="number"
                placeholder="e.g., 100000000"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assets">Total Assets (₦)</Label>
              <Input
                id="assets"
                type="number"
                placeholder="e.g., 500000000"
                value={totalAssets}
                onChange={(e) => setTotalAssets(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profit">Assessable Profit (₦)</Label>
              <Input
                id="profit"
                type="number"
                placeholder="e.g., 25000000"
                value={assessableProfit}
                onChange={(e) => setAssessableProfit(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="professional"
                checked={isProfessionalService}
                onChange={(e) => setIsProfessionalService(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="professional" className="cursor-pointer">
                Professional service provider
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={calculateBusinessTax} className="w-full" size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Tax
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Classification</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${
                      result.isSmallCompany ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <p className="font-semibold text-lg">
                      {result.isSmallCompany ? '✅ Small Company' : '🏢 Other Company'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.isSmallCompany
                        ? 'Qualifies for 0% tax rate and development levy exemption'
                        : 'Subject to standard corporate tax rate and development levy'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Assessable Profit</span>
                      <span className="font-semibold">{formatCurrency(result.breakdown.assessableProfit)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Corporate Tax ({result.breakdown.corporateTaxRate}%)</span>
                      <span className="font-semibold">{formatCurrency(result.corporateTax)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Development Levy ({result.breakdown.developmentLevyRate}%)</span>
                      <span className="font-semibold">{formatCurrency(result.developmentLevy)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-primary/10 px-3 rounded-lg mt-2">
                      <span className="font-bold">Total Tax Due</span>
                      <span className="font-bold text-lg">{formatCurrency(result.totalTax)}</span>
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
                  <p>Enter company details and click Calculate Tax to see results</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5" />
                Tax Rules (2025)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <p className="font-semibold">Small Company Criteria:</p>
                <ul className="list-disc list-inside text-muted-foreground ml-2">
                  <li>Turnover ≤ ₦50 million</li>
                  <li>Total assets ≤ ₦250 million</li>
                  <li>Not a professional service provider</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold">Tax Rates:</p>
                <ul className="list-disc list-inside text-muted-foreground ml-2">
                  <li>Small companies: 0%</li>
                  <li>Other companies: 30%</li>
                  <li>Development levy: 4% (exempt for small companies)</li>
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
