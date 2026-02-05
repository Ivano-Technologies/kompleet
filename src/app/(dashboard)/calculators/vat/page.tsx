'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator, CheckCircle2, XCircle, Loader2, Download } from 'lucide-react';
import { useTaxRules } from '@/hooks/useTaxRules';
import { logCalculation } from '@/hooks/useAuditLog';
import { generateCalculationPDF } from '@/lib/pdf-generator';

interface VATResult {
  isExempt: boolean;
  exemptionReason: string | null;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
}

export default function VATCalculatorPage() {
  const [amount, setAmount] = useState<string>('');
  const [turnover, setTurnover] = useState<string>('');
  const [totalAssets, setTotalAssets] = useState<string>('');
  const [isRentTransaction, setIsRentTransaction] = useState<boolean>(false);
  const [calculationType, setCalculationType] = useState<'add' | 'extract'>('add');
  const [result, setResult] = useState<VATResult | null>(null);
  const [error, setError] = useState<string>('');

  // Fetch VAT rules from database
  const { rules, loading: rulesLoading, error: rulesError } = useTaxRules('vat');

  const calculateVAT = () => {
    setError('');
    setResult(null);

    // Check if rules are loaded
    if (!rules) {
      setError('Tax rules are not loaded yet. Please wait...');
      return;
    }

    // Validation
    const amountNum = parseFloat(amount);
    const turnoverNum = parseFloat(turnover || '0');
    const assetsNum = parseFloat(totalAssets || '0');

    if (isNaN(amountNum) || amountNum < 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (isNaN(turnoverNum) || turnoverNum < 0) {
      setError('Please enter a valid turnover amount');
      return;
    }

    if (isNaN(assetsNum) || assetsNum < 0) {
      setError('Please enter a valid total assets amount');
      return;
    }

    // Get VAT rate and thresholds from database
    const VAT_RATE = (rules.standard_rate?.value?.rate || 7.5) / 100;
    const SMALL_BUSINESS_TURNOVER_THRESHOLD = rules.small_business_exemption_turnover?.value?.threshold || 100_000_000;
    const SMALL_BUSINESS_ASSETS_THRESHOLD = rules.small_business_exemption_assets?.value?.threshold || 250_000_000;

    // Check VAT exemptions
    let isExempt = false;
    let exemptionReason: string | null = null;

    // Rent exemption
    if (isRentTransaction) {
      isExempt = true;
      exemptionReason = 'Rent transactions are exempt from VAT';
    }

    // Small business exemption
    if (
      !isExempt &&
      turnoverNum < SMALL_BUSINESS_TURNOVER_THRESHOLD &&
      assetsNum < SMALL_BUSINESS_ASSETS_THRESHOLD
    ) {
      isExempt = true;
      exemptionReason = `Small business exemption (turnover < ₦${(SMALL_BUSINESS_TURNOVER_THRESHOLD / 1_000_000).toFixed(0)}M and assets < ₦${(SMALL_BUSINESS_ASSETS_THRESHOLD / 1_000_000).toFixed(0)}M)`;
    }

    let netAmount: number;
    let vatAmount: number;
    let grossAmount: number;

    if (isExempt) {
      netAmount = amountNum;
      vatAmount = 0;
      grossAmount = amountNum;
    } else {
      if (calculationType === 'add') {
        // Add VAT to amount
        netAmount = amountNum;
        vatAmount = amountNum * VAT_RATE;
        grossAmount = netAmount + vatAmount;
      } else {
        // Extract VAT from amount
        grossAmount = amountNum;
        netAmount = amountNum / (1 + VAT_RATE);
        vatAmount = grossAmount - netAmount;
      }
    }

    const calculationResult = {
      isExempt,
      exemptionReason,
      netAmount,
      vatAmount,
      grossAmount,
      vatRate: VAT_RATE * 100,
    };

    setResult(calculationResult);

    // Log calculation for audit trail
    logCalculation(
      'vat',
      {
        amount: amountNum,
        turnover: turnoverNum,
        totalAssets: assetsNum,
        isRentTransaction,
        calculationType,
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
          <h1 className="text-3xl font-bold mb-2">VAT Calculator</h1>
          <p className="text-muted-foreground">
            Calculate Value Added Tax under Nigeria Tax Act 2025
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
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>Enter transaction and business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Calculation Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="add"
                      checked={calculationType === 'add'}
                      onChange={(e) => setCalculationType('add')}
                      className="h-4 w-4"
                      disabled={rulesLoading}
                    />
                    <span>Add VAT</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="extract"
                      checked={calculationType === 'extract'}
                      onChange={(e) => setCalculationType('extract')}
                      className="h-4 w-4"
                      disabled={rulesLoading}
                    />
                    <span>Extract VAT</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  {calculationType === 'add' ? 'Net Amount (₦)' : 'Gross Amount (₦)'}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={rulesLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="turnover">Annual Turnover (₦)</Label>
                <Input
                  id="turnover"
                  type="number"
                  placeholder="e.g., 50000000"
                  value={turnover}
                  onChange={(e) => setTurnover(e.target.value)}
                  disabled={rulesLoading}
                />
                <p className="text-xs text-muted-foreground">
                  For small business exemption check
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assets">Total Assets (₦)</Label>
                <Input
                  id="assets"
                  type="number"
                  placeholder="e.g., 200000000"
                  value={totalAssets}
                  onChange={(e) => setTotalAssets(e.target.value)}
                  disabled={rulesLoading}
                />
                <p className="text-xs text-muted-foreground">
                  For small business exemption check
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rent"
                  checked={isRentTransaction}
                  onChange={(e) => setIsRentTransaction(e.target.checked)}
                  className="h-4 w-4"
                  disabled={rulesLoading}
                />
                <Label htmlFor="rent" className="font-normal">
                  This is a rent transaction (exempt from VAT)
                </Label>
              </div>

              <Button 
                onClick={calculateVAT} 
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
                    Calculate VAT
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
                <CardTitle>VAT Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                    <div>
                      <p className="font-medium">Standard VAT Rate</p>
                      <p className="text-muted-foreground">
                        {rules?.standard_rate?.value?.rate || 7.5}% (unchanged from previous law)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                    <div>
                      <p className="font-medium">Small Business Exemption</p>
                      <p className="text-muted-foreground">
                        Turnover {'<'} ₦{((rules?.small_business_exemption_turnover?.value?.threshold || 100_000_000) / 1_000_000).toFixed(0)}M AND Assets {'<'} ₦{((rules?.small_business_exemption_assets?.value?.threshold || 250_000_000) / 1_000_000).toFixed(0)}M
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <XCircle className="h-4 w-4 mr-2 mt-0.5 text-orange-500" />
                    <div>
                      <p className="font-medium">Rent Exemption</p>
                      <p className="text-muted-foreground">
                        Rent (land or building) is exempt from VAT
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>VAT Calculation Result</CardTitle>
                  {result.isExempt && (
                    <Alert className="mt-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{result.exemptionReason}</AlertDescription>
                    </Alert>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Net Amount:</span>
                    <span className="font-medium">{formatCurrency(result.netAmount)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>VAT ({result.vatRate}%):</span>
                    <span className="font-medium">{formatCurrency(result.vatAmount)}</span>
                  </div>

                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Gross Amount:</span>
                    <span>{formatCurrency(result.grossAmount)}</span>
                  </div>

                  {!result.isExempt && (
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertDescription>
                        VAT of {formatCurrency(result.vatAmount)} {calculationType === 'add' ? 'added to' : 'extracted from'} the amount
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={() => {
                      if (!result) return;
                      generateCalculationPDF({
                        calculatorType: 'VAT Calculator',
                        date: new Date().toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }),
                        inputs: {
                          amount: parseFloat(amount),
                          calculation_type: calculationType === 'add' ? 'Add VAT' : 'Extract VAT',
                          turnover: parseFloat(turnover) || 0,
                          total_assets: parseFloat(totalAssets) || 0,
                          is_rent_transaction: isRentTransaction ? 'Yes' : 'No',
                        },
                        results: {
                          vat_status: result.isExempt ? 'Exempt' : 'Applicable',
                          exemption_reason: result.exemptionReason || 'N/A',
                          net_amount: result.netAmount,
                          vat_amount: result.vatAmount,
                          gross_amount: result.grossAmount,
                          vat_rate: `${result.vatRate}%`,
                        },
                        ruleVersion: 'v1.0.0-2025-tax-act',
                        sources: ['Federal Inland Revenue Service (FIRS)', 'EY Analysis', 'KPMG Analysis'],
                        confidenceLevel: 'High',
                      });
                    }}
                    variant="outline"
                    className="w-full mt-4"
                  >
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
              This calculator implements the Nigeria Tax Act 2025 VAT provisions. VAT rates and
              exemption thresholds are fetched dynamically from the KOMPLEET Tax Rules Engine.
            </p>
            <p>
              <strong>Data Source:</strong> Federal Inland Revenue Service (FIRS), validated by EY
              and KPMG analyses. Confidence level: {rules?.standard_rate?.confidence || 'high'}.
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
