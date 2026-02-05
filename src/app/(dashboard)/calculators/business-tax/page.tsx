'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator, Loader2, Download } from 'lucide-react';
import { useTaxRules } from '@/hooks/useTaxRules';
import { logCalculation } from '@/hooks/useAuditLog';
import { generateCalculationPDF } from '@/lib/pdf-generator';

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

  // Fetch tax rules from database
  const { rules, loading: rulesLoading, error: rulesError } = useTaxRules('business_tax');

  const calculateBusinessTax = () => {
    setError('');
    setResult(null);

    // Check if rules are loaded
    if (!rules) {
      setError('Tax rules are not loaded yet. Please wait...');
      return;
    }

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

    // Get thresholds from database rules
    const SMALL_COMPANY_TURNOVER_THRESHOLD = rules.small_company_turnover_threshold?.value?.value || 50_000_000;
    const SMALL_COMPANY_ASSETS_THRESHOLD = rules.small_company_assets_threshold?.value?.value || 250_000_000;

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
      corporateTaxRate = (rules.corporate_tax_rate_small?.value?.rate || 0) / 100;
      developmentLevyRate = 0;
      corporateTax = 0;
      developmentLevy = 0;
    } else {
      // Other companies: Get rates from database
      corporateTaxRate = (rules.corporate_tax_rate_other?.value?.rate || 30) / 100;
      developmentLevyRate = (rules.development_levy_rate?.value?.rate || 4) / 100;
      corporateTax = profitNum * corporateTaxRate;
      developmentLevy = profitNum * developmentLevyRate;
    }

    const totalTax = corporateTax + developmentLevy;
    const effectiveTaxRate = profitNum > 0 ? (totalTax / profitNum) * 100 : 0;

    const calculationResult = {
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
    };

    setResult(calculationResult);

    // Log calculation for audit trail
    logCalculation(
      'business_tax',
      {
        turnover: turnoverNum,
        totalAssets: assetsNum,
        assessableProfit: profitNum,
        isProfessionalService,
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

  const handleExportPDF = () => {
    if (!result) return;

    generateCalculationPDF({
      calculatorType: 'Business Tax Calculator',
      date: new Date().toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      inputs: {
        turnover: parseFloat(turnover),
        total_assets: parseFloat(totalAssets),
        assessable_profit: parseFloat(assessableProfit),
        is_professional_service: isProfessionalService ? 'Yes' : 'No',
      },
      results: {
        company_classification: result.isSmallCompany ? 'Small Company' : 'Other Company',
        corporate_tax: result.corporateTax,
        development_levy: result.developmentLevy,
        total_tax: result.totalTax,
        effective_tax_rate: `${result.effectiveTaxRate.toFixed(2)}%`,
      },
      ruleVersion: 'v1.0.0-2025-tax-act',
      sources: ['Federal Inland Revenue Service (FIRS)', 'EY Analysis', 'KPMG Analysis'],
      confidenceLevel: 'High',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Business Tax Calculator</h1>
          <p className="text-muted-foreground">
            Calculate corporate income tax and development levy under Nigeria Tax Act 2025
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
                  disabled={rulesLoading}
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
                  disabled={rulesLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profit">Assessable Profit (₦)</Label>
                <Input
                  id="profit"
                  type="number"
                  placeholder="e.g., 30000000"
                  value={assessableProfit}
                  onChange={(e) => setAssessableProfit(e.target.value)}
                  disabled={rulesLoading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="professional"
                  checked={isProfessionalService}
                  onChange={(e) => setIsProfessionalService(e.target.checked)}
                  className="h-4 w-4"
                  disabled={rulesLoading}
                />
                <Label htmlFor="professional" className="font-normal">
                  Professional service provider (lawyers, accountants, etc.)
                </Label>
              </div>

              <Button 
                onClick={calculateBusinessTax} 
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
            <Card>
              <CardHeader>
                <CardTitle>Small Company Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                    <span>
                      Turnover ≤ {formatCurrency(rules?.small_company_turnover_threshold?.value?.value || 50_000_000)}
                    </span>
                  </p>
                  <p className="flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                    <span>
                      Total Assets ≤ {formatCurrency(rules?.small_company_assets_threshold?.value?.value || 250_000_000)}
                    </span>
                  </p>
                  <p className="flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                    <span>NOT a professional service provider</span>
                  </p>
                  <p className="mt-4 text-muted-foreground">
                    Small companies enjoy 0% income tax and are exempt from development levy.
                  </p>
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Tax Calculation Result</CardTitle>
                  <CardDescription>
                    {result.isSmallCompany ? 'Small Company' : 'Other Company'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Assessable Profit:</span>
                      <span className="font-medium">
                        {formatCurrency(result.breakdown.assessableProfit)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Corporate Tax ({result.breakdown.corporateTaxRate}%):</span>
                      <span className="font-medium">{formatCurrency(result.corporateTax)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Development Levy ({result.breakdown.developmentLevyRate}%):</span>
                      <span className="font-medium">{formatCurrency(result.developmentLevy)}</span>
                    </div>

                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Tax Payable:</span>
                      <span className="text-lg">{formatCurrency(result.totalTax)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Effective Tax Rate:</span>
                      <span>{result.effectiveTaxRate.toFixed(2)}%</span>
                    </div>
                  </div>

                  {result.isSmallCompany && (
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertDescription>
                        Your company qualifies as a small company and enjoys 0% tax rate with no
                        development levy obligation.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={handleExportPDF} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
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
              This calculator implements the Nigeria Tax Act 2025 provisions for business taxation.
              Tax rates and thresholds are fetched dynamically from the KOMPLEET Tax Rules Engine.
            </p>
            <p>
              <strong>Data Source:</strong> Federal Inland Revenue Service (FIRS), validated by EY
              and KPMG analyses. Confidence level: {rules?.corporate_tax_rate_other?.confidence || 'high'}.
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
