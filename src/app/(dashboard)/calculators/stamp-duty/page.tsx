
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator, Download, Loader2, FileDigit } from 'lucide-react';
import { generateCalculationPDF } from '@/lib/pdf-generator';

interface StampDutyResult {
  transactionType: string;
  amount: number;
  leaseDuration?: number;
  stampDuty: number;
  applicableRate: number;
  isExempt: boolean;
  exemptionReason?: string;
}

export default function StampDutyCalculator() {
  const [transactionType, setTransactionType] = useState<'transfer' | 'lease'>('transfer');
  const [amount, setAmount] = useState('');
  const [leaseDuration, setLeaseDuration] = useState('');
  const [result, setResult] = useState<StampDutyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');
  
  const [rules, setRules] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setRulesLoading(true);
        const response = await fetch('/api/tax-rules?type=stamp_duty');
        const data = await response.json();
        
        if (data.success) {
          setRules(data.rules);
        } else {
          setRulesError('Failed to load tax rules');
        }
      } catch (error) {
        console.error('Error fetching tax rules:', error);
        setRulesError('Error loading tax rules');
      } finally {
        setRulesLoading(false);
      }
    };

    fetchRules();
  }, []);

  const calculateStampDuty = () => {
    if (!amount) {
      alert('Please enter an amount');
      return;
    }

    if (transactionType === 'lease' && !leaseDuration) {
      alert('Please enter lease duration');
      return;
    }

    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      const lowValueThreshold = rules.low_value_exemption?.value?.threshold || 10000000;
      
      let stampDuty = 0;
      let applicableRate = 0;
      let isExempt = false;
      let exemptionReason = '';

      if (amountValue < lowValueThreshold) {
        isExempt = true;
        exemptionReason = `Transaction value below ₦${lowValueThreshold.toLocaleString()} threshold`;
      } else {
        if (transactionType === 'transfer') {
          applicableRate = rules.property_transfer_rate?.value?.rate || 1.5;
          stampDuty = amountValue * (applicableRate / 100);
        } else {
          const duration = parseInt(leaseDuration);
          if (duration <= 7) {
            applicableRate = rules.lease_rate_short?.value?.rate || 0.78;
          } else {
            applicableRate = rules.lease_rate_long?.value?.rate || 3;
          }
          stampDuty = amountValue * (applicableRate / 100);
        }
      }

      const calculationResult: StampDutyResult = {
        transactionType,
        amount: amountValue,
        leaseDuration: transactionType === 'lease' ? parseInt(leaseDuration) : undefined,
        stampDuty,
        applicableRate,
        isExempt,
        exemptionReason,
      };

      setResult(calculationResult);
      logCalculation(calculationResult);
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Error calculating stamp duty');
    } finally {
      setLoading(false);
    }
  };

  const logCalculation = async (calculationResult: StampDutyResult) => {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculationType: 'stamp_duty',
          inputData: {
            transactionType,
            amount: parseFloat(amount),
            leaseDuration: transactionType === 'lease' ? parseInt(leaseDuration) : undefined,
          },
          outputData: {
            stampDuty: calculationResult.stampDuty,
            applicableRate: calculationResult.applicableRate,
            isExempt: calculationResult.isExempt,
          },
        }),
      });
    } catch (error) {
      console.error('Error logging calculation:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (rulesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-light-text-secondary dark:text-dark-text-secondary">
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary-500" />
            <p className="mt-4">Loading tax rules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <FileDigit className="h-8 w-8 text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Stamp Duty Calculator</h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Calculate stamp duty on property transactions and lease agreements under Nigeria Tax Act 2025
          </p>
        </div>
      </div>

      {rulesError && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            {rulesError}. Using fallback rates: Transfer 1.5%, Lease ≤7yrs 0.78%, Lease {'>'}7yrs 3%.
          </AlertDescription>
        </Alert>
      )}

      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <h2 className="text-xl font-semibold mb-1 text-light-text-primary dark:text-dark-text-primary">Transaction Details</h2>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">Enter your transaction information</p>

        <div className="space-y-4">
          <div>
            <Label className="text-light-text-primary dark:text-dark-text-primary">Transaction Type</Label>
            <div className="flex gap-4 mt-2 text-light-text-secondary dark:text-dark-text-secondary">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="transfer"
                  checked={transactionType === 'transfer'}
                  onChange={(e) => setTransactionType(e.target.value as 'transfer')}
                  disabled={loading}
                  className="mr-2 rounded-lg"
                />
                Property Transfer (Sale/Purchase)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="lease"
                  checked={transactionType === 'lease'}
                  onChange={(e) => setTransactionType(e.target.value as 'lease')}
                  disabled={loading}
                  className="mr-2 rounded-lg"
                />
                Lease Agreement
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="amount" className="text-light-text-primary dark:text-dark-text-primary">
              {transactionType === 'transfer' ? 'Property Value (₦)' : 'Annual Rent (₦)'}
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder={transactionType === 'transfer' ? 'e.g., 50000000' : 'e.g., 5000000'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              className="rounded-lg"
            />
          </div>

          {transactionType === 'lease' && (
            <div>
              <Label htmlFor="leaseDuration" className="text-light-text-primary dark:text-dark-text-primary">Lease Duration (years)</Label>
              <Input
                id="leaseDuration"
                type="number"
                placeholder="e.g., 5"
                value={leaseDuration}
                onChange={(e) => setLeaseDuration(e.target.value)}
                disabled={loading}
                min="1"
                className="rounded-lg"
              />
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                ≤7 years: 0.78% rate | {'>'}7 years: 3% rate
              </p>
            </div>
          )}

          <Button
            onClick={calculateStampDuty}
            disabled={loading || !amount || (transactionType === 'lease' && !leaseDuration)}
            className="w-full btn-primary rounded-lg"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
            {loading ? 'Calculating...' : 'Calculate Stamp Duty'}
          </Button>
        </div>
      </div>

      {result && (
        <div className={`p-5 rounded-xl border ${result.isExempt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'} mb-6`}>
          <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">Stamp Duty Result</h2>

          {result.isExempt ? (
            <Alert className="border-blue-500 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <strong className="text-light-text-primary dark:text-dark-text-primary">Exempt from Stamp Duty</strong>
                <br />
                <span className="text-light-text-secondary dark:text-dark-text-secondary">{result.exemptionReason}</span>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 text-light-text-secondary dark:text-dark-text-secondary">
              <div className="flex justify-between">
                <span className="font-medium">Transaction Type:</span>
                <span className="capitalize font-semibold text-light-text-primary dark:text-dark-text-primary">{result.transactionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">
                  {result.transactionType === 'transfer' ? 'Property Value:' : 'Annual Rent:'}
                </span>
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{formatCurrency(result.amount)}</span>
              </div>
              {result.leaseDuration && (
                <div className="flex justify-between">
                  <span className="font-medium">Lease Duration:</span>
                  <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{result.leaseDuration} years</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Applicable Rate:</span>
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{result.applicableRate}%</span>
              </div>
              <div className="flex justify-between border-t border-light-border dark:border-dark-border pt-3 mt-3">
                <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">Stamp Duty Payable:</span>
                <span className="font-bold text-lg text-primary-600 dark:text-primary-400">{formatCurrency(result.stampDuty)}</span>
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              if (!result) return;
              generateCalculationPDF({
                calculatorType: 'Stamp Duty Calculator',
                date: new Date().toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                inputs: {
                  transaction_type: result.transactionType,
                  amount: result.amount,
                  lease_duration: result.leaseDuration ? `${result.leaseDuration} years` : 'N/A',
                },
                results: {
                  exemption_status: result.isExempt ? 'Exempt' : 'Applicable',
                  exemption_reason: result.exemptionReason || 'N/A',
                  applicable_rate: `${result.applicableRate}%`,
                  stamp_duty: result.stampDuty,
                },
                ruleVersion: 'v1.0.0-2025-tax-act',
                sources: ['Federal Inland Revenue Service (FIRS)'],
                confidenceLevel: 'High',
              });
            }}
            variant="outline"
            className="w-full mt-4 btn-secondary rounded-lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Export as PDF
          </Button>
        </div>
      )}

      <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-dark-surface">
        <h3 className="font-semibold mb-2 flex items-center text-light-text-primary dark:text-dark-text-primary">
          <InfoIcon className="mr-2 h-5 w-5 text-blue-500" />
          About This Calculator
        </h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
          This calculator implements the Nigeria Tax Act 2025 provisions for stamp duty on property
          transactions and leases. Tax rates are fetched dynamically from the KOMPLEET Tax Rules Engine.
        </p>
        <div className="text-sm space-y-2 text-light-text-secondary dark:text-dark-text-secondary">
          <p>
            <strong className="text-light-text-primary dark:text-dark-text-primary">Stamp Duty Rates:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Property Transfer: {rules.property_transfer_rate?.value?.rate || 1.5}%</li>
            <li>Short-term Lease (≤7 years): {rules.lease_rate_short?.value?.rate || 0.78}%</li>
            <li>Long-term Lease ({'>'}7 years): {rules.lease_rate_long?.value?.rate || 3}%</li>
            <li>Low-value Exemption: Below ₦{(rules.low_value_exemption?.value?.threshold || 10000000).toLocaleString()}</li>
          </ul>
          <p className="mt-4">
            <strong className="text-light-text-primary dark:text-dark-text-primary">Data Source:</strong> Federal Inland Revenue Service (FIRS), validated by EY and KPMG analyses.
            Confidence level: {rules.property_transfer_rate?.confidence || 'high'}.
          </p>
          <p>
            <strong className="text-light-text-primary dark:text-dark-text-primary">Disclaimer:</strong> This is an estimate. Consult a qualified Nigerian tax professional for personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
}
