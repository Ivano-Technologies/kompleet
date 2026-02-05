'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator } from 'lucide-react';

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
  
  // Tax rules from database
  const [rules, setRules] = useState<Record<string, any>>({});

  // Fetch tax rules on component mount
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

      // Check low-value exemption
      if (amountValue < lowValueThreshold) {
        isExempt = true;
        exemptionReason = `Transaction value below ₦${lowValueThreshold.toLocaleString()} threshold`;
      } else {
        if (transactionType === 'transfer') {
          // Property transfer: 1.5%
          applicableRate = rules.property_transfer_rate?.value?.rate || 1.5;
          stampDuty = amountValue * (applicableRate / 100);
        } else {
          // Lease: 0.78% (≤7 years) or 3% (>7 years)
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

      // Log calculation to audit trail
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tax rules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stamp Duty Calculator</h1>
        <p className="text-gray-600">
          Calculate stamp duty on property transactions and lease agreements under Nigeria Tax Act 2025
        </p>
      </div>

      {rulesError && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            {rulesError}. Using fallback rates: Transfer 1.5%, Lease ≤7yrs 0.78%, Lease &gt;7yrs 3%.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Transaction Details</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your transaction information</p>

        <div className="space-y-4">
          <div>
            <Label>Transaction Type</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="transfer"
                  checked={transactionType === 'transfer'}
                  onChange={(e) => setTransactionType(e.target.value as 'transfer')}
                  disabled={loading}
                  className="mr-2"
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
                  className="mr-2"
                />
                Lease Agreement
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">
              {transactionType === 'transfer' ? 'Property Value (₦)' : 'Annual Rent (₦)'}
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder={transactionType === 'transfer' ? 'e.g., 50000000' : 'e.g., 5000000'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          {transactionType === 'lease' && (
            <div>
              <Label htmlFor="leaseDuration">Lease Duration (years)</Label>
              <Input
                id="leaseDuration"
                type="number"
                placeholder="e.g., 5"
                value={leaseDuration}
                onChange={(e) => setLeaseDuration(e.target.value)}
                disabled={loading}
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                ≤7 years: 0.78% rate | &gt;7 years: 3% rate
              </p>
            </div>
          )}

          <Button
            onClick={calculateStampDuty}
            disabled={loading || !amount || (transactionType === 'lease' && !leaseDuration)}
            className="w-full"
          >
            <Calculator className="mr-2 h-4 w-4" />
            {loading ? 'Calculating...' : 'Calculate Stamp Duty'}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className={`p-6 mb-6 ${result.isExempt ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
          <h2 className="text-xl font-semibold mb-4">Stamp Duty Result</h2>

          {result.isExempt ? (
            <Alert className="border-blue-500 bg-blue-100">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Exempt from Stamp Duty</strong>
                <br />
                {result.exemptionReason}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Transaction Type:</span>
                <span className="capitalize">{result.transactionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">
                  {result.transactionType === 'transfer' ? 'Property Value:' : 'Annual Rent:'}
                </span>
                <span>{formatCurrency(result.amount)}</span>
              </div>
              {result.leaseDuration && (
                <div className="flex justify-between">
                  <span className="font-medium">Lease Duration:</span>
                  <span>{result.leaseDuration} years</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Applicable Rate:</span>
                <span>{result.applicableRate}%</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold text-lg">Stamp Duty Payable:</span>
                <span className="font-bold text-lg text-green-700">{formatCurrency(result.stampDuty)}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 flex items-center">
          <InfoIcon className="mr-2 h-5 w-5" />
          About This Calculator
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          This calculator implements the Nigeria Tax Act 2025 provisions for stamp duty on property
          transactions and leases. Tax rates are fetched dynamically from the KOMPLEET Tax Rules Engine.
        </p>
        <div className="text-sm space-y-2">
          <p>
            <strong>Stamp Duty Rates:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Property Transfer: {rules.property_transfer_rate?.value?.rate || 1.5}%</li>
            <li>Short-term Lease (≤7 years): {rules.lease_rate_short?.value?.rate || 0.78}%</li>
            <li>Long-term Lease (&gt;7 years): {rules.lease_rate_long?.value?.rate || 3}%</li>
            <li>Low-value Exemption: Below ₦{(rules.low_value_exemption?.value?.threshold || 10000000).toLocaleString()}</li>
          </ul>
          <p className="mt-4">
            <strong>Data Source:</strong> Federal Inland Revenue Service (FIRS), validated by EY and KPMG analyses.
            Confidence level: {rules.property_transfer_rate?.confidence || 'high'}.
          </p>
          <p>
            <strong>Disclaimer:</strong> This is an estimate. Consult a qualified Nigerian tax professional for personalized advice.
          </p>
        </div>
      </Card>
    </div>
  );
}
