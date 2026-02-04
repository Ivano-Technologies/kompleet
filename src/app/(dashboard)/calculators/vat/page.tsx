'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator, CheckCircle2, XCircle } from 'lucide-react';

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

  const VAT_RATE = 0.075; // 7.5%
  const SMALL_BUSINESS_TURNOVER_THRESHOLD = 100_000_000; // N100M
  const SMALL_BUSINESS_ASSETS_THRESHOLD = 250_000_000; // N250M

  const calculateVAT = () => {
    setError('');
    setResult(null);

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

    // Check VAT exemptions
    let isExempt = false;
    let exemptionReason: string | null = null;

    // 1. Rent transactions are VAT exempt
    if (isRentTransaction) {
      isExempt = true;
      exemptionReason = 'Rent transactions are exempt from VAT';
    }

    // 2. Small business exemption: Turnover < N100M AND Assets < N250M
    if (
      !isExempt &&
      turnoverNum < SMALL_BUSINESS_TURNOVER_THRESHOLD &&
      assetsNum < SMALL_BUSINESS_ASSETS_THRESHOLD
    ) {
      isExempt = true;
      exemptionReason = 'Small business exemption (Turnover < ₦100M and Assets < ₦250M)';
    }

    let netAmount: number;
    let vatAmount: number;
    let grossAmount: number;

    if (isExempt) {
      // No VAT applicable
      netAmount = amountNum;
      vatAmount = 0;
      grossAmount = amountNum;
    } else {
      if (calculationType === 'add') {
        // Add VAT to net amount
        netAmount = amountNum;
        vatAmount = netAmount * VAT_RATE;
        grossAmount = netAmount + vatAmount;
      } else {
        // Extract VAT from gross amount
        grossAmount = amountNum;
        netAmount = grossAmount / (1 + VAT_RATE);
        vatAmount = grossAmount - netAmount;
      }
    }

    setResult({
      isExempt,
      exemptionReason,
      netAmount,
      vatAmount,
      grossAmount,
      vatRate: VAT_RATE * 100,
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">VAT Calculator</h1>
        <p className="text-muted-foreground">
          Calculate Value Added Tax under the Nigeria Tax Act 2025 (7.5% standard rate)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Enter transaction amount and business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Calculation Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={calculationType === 'add' ? 'default' : 'outline'}
                  onClick={() => setCalculationType('add')}
                  className="flex-1"
                >
                  Add VAT
                </Button>
                <Button
                  type="button"
                  variant={calculationType === 'extract' ? 'default' : 'outline'}
                  onClick={() => setCalculationType('extract')}
                  className="flex-1"
                >
                  Extract VAT
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {calculationType === 'add'
                  ? 'Calculate VAT to add to net amount'
                  : 'Extract VAT from gross amount (VAT inclusive)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                {calculationType === 'add' ? 'Net Amount (₦)' : 'Gross Amount (₦)'}
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 1000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assets">Total Assets (₦)</Label>
              <Input
                id="assets"
                type="number"
                placeholder="e.g., 200000000"
                value={totalAssets}
                onChange={(e) => setTotalAssets(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rent"
                checked={isRentTransaction}
                onChange={(e) => setIsRentTransaction(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="rent" className="cursor-pointer">
                This is a rent transaction
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={calculateVAT} className="w-full" size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate VAT
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>VAT Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {/* Exemption Status */}
                  <div
                    className={`p-4 rounded-lg ${
                      result.isExempt
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.isExempt ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {result.isExempt ? 'VAT Exempt' : 'VAT Applicable'}
                        </p>
                        {result.exemptionReason && (
                          <p className="text-sm text-muted-foreground mt-1">{result.exemptionReason}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Net Amount</span>
                      <span className="font-semibold">{formatCurrency(result.netAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">
                        VAT ({result.vatRate}%)
                        {result.isExempt && <span className="text-xs text-muted-foreground ml-1">(Exempt)</span>}
                      </span>
                      <span className={`font-semibold ${result.isExempt ? 'text-green-600' : ''}`}>
                        {result.isExempt ? '₦0.00' : formatCurrency(result.vatAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-primary/10 px-3 rounded-lg mt-2">
                      <span className="font-bold">Gross Amount</span>
                      <span className="font-bold text-lg">{formatCurrency(result.grossAmount)}</span>
                    </div>
                  </div>

                  {/* Calculation Formula */}
                  {!result.isExempt && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-semibold mb-1">Formula:</p>
                      <p className="text-muted-foreground">
                        {calculationType === 'add'
                          ? `Gross = Net × (1 + ${result.vatRate}%) = ${formatCurrency(result.netAmount)} × 1.075`
                          : `Net = Gross ÷ (1 + ${result.vatRate}%) = ${formatCurrency(result.grossAmount)} ÷ 1.075`}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Enter transaction details and click Calculate VAT to see results</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5" />
                VAT Rules (2025)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <p className="font-semibold">Standard Rate:</p>
                <p className="text-muted-foreground">7.5% (unchanged from previous law)</p>
              </div>
              <div>
                <p className="font-semibold">Small Business Exemption:</p>
                <ul className="list-disc list-inside text-muted-foreground ml-2">
                  <li>Turnover &lt; ₦100 million AND</li>
                  <li>Total assets &lt; ₦250 million</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold">Exempt Items:</p>
                <ul className="list-disc list-inside text-muted-foreground ml-2">
                  <li>Rent (land or building)</li>
                  <li>Essential goods and services</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold">Input VAT Recovery:</p>
                <p className="text-muted-foreground">All input tax recoverable from output tax</p>
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
