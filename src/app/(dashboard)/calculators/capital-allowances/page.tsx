
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator, Download, Loader2, Building, Car, Package } from 'lucide-react';
import { generateCalculationPDF } from '@/lib/pdf-generator';

interface DepreciationSchedule {
  year: number;
  openingValue: number;
  allowance: number;
  closingValue: number;
}

interface CapitalAllowanceResult {
  assetType: string;
  assetCost: number;
  allowanceRate: number;
  annualAllowance: number;
  firstYearAllowance: number;
  yearsToFullDepreciation: number;
  schedule: DepreciationSchedule[];
}

export default function CapitalAllowancesCalculator() {
  const [assetType, setAssetType] = useState('');
  const [assetCost, setAssetCost] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [result, setResult] = useState<CapitalAllowanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');
  
  const [rules, setRules] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setRulesLoading(true);
        const response = await fetch('/api/tax-rules?type=capital_allowance');
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

  const getAssetRate = (type: string): number => {
    const rateMap: Record<string, number> = {
      'buildings': rules.rate_10_percent?.value?.rate || 10,
      'plant': rules.rate_20_percent?.value?.rate || 20,
      'vehicles': rules.rate_25_percent?.value?.rate || 25,
    };
    return rateMap[type] || 0;
  };

  const calculateCapitalAllowance = () => {
    if (!assetType || !assetCost || !acquisitionDate) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const cost = parseFloat(assetCost);
      const rate = getAssetRate(assetType);
      const annualAllowance = cost * (rate / 100);

      const acquisitionDateObj = new Date(acquisitionDate);
      const yearEnd = new Date(acquisitionDateObj.getFullYear(), 11, 31);
      const monthsOwned = Math.ceil(
        (yearEnd.getTime() - acquisitionDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const firstYearAllowance = annualAllowance * (monthsOwned / 12);

      const schedule: DepreciationSchedule[] = [];
      let remainingValue = cost;

      for (let year = 1; year <= 10; year++) {
        const yearAllowance = year === 1 ? firstYearAllowance : annualAllowance;
        const allowanceAmount = Math.min(yearAllowance, remainingValue);
        
        schedule.push({
          year,
          openingValue: remainingValue,
          allowance: allowanceAmount,
          closingValue: remainingValue - allowanceAmount,
        });

        remainingValue -= allowanceAmount;

        if (remainingValue <= 0) break;
      }

      const yearsToFullDepreciation = Math.ceil(cost / annualAllowance);

      const calculationResult: CapitalAllowanceResult = {
        assetType,
        assetCost: cost,
        allowanceRate: rate,
        annualAllowance,
        firstYearAllowance,
        yearsToFullDepreciation,
        schedule,
      };

      setResult(calculationResult);

      logCalculation(calculationResult);
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Error calculating capital allowance');
    } finally {
      setLoading(false);
    }
  };

  const logCalculation = async (calculationResult: CapitalAllowanceResult) => {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculationType: 'capital_allowance',
          inputData: {
            assetType,
            assetCost: parseFloat(assetCost),
            acquisitionDate,
          },
          outputData: {
            allowanceRate: calculationResult.allowanceRate,
            annualAllowance: calculationResult.annualAllowance,
            firstYearAllowance: calculationResult.firstYearAllowance,
            yearsToFullDepreciation: calculationResult.yearsToFullDepreciation,
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
            <Loader2 className="animate-spin h-12 w-12 text-primary-500 mx-auto" />
            <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Loading tax rules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <Calculator className="h-8 w-8 text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Capital Allowances Calculator</h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Calculate annual depreciation allowances for business assets under Nigeria Tax Act 2025
          </p>
        </div>
      </div>

      {rulesError && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            {rulesError}. Using fallback rates: 10%, 20%, 25%.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">Asset Information</h2>
        <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-4">Enter your asset details</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="assetType">Asset Type</Label>
            <select
              id="assetType"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
              disabled={loading}
            >
              <option value="">Select asset type...</option>
              <option value="buildings">Buildings, Structures, Masts (10%)</option>
              <option value="plant">Plant, Machinery, Equipment, Furniture (20%)</option>
              <option value="vehicles">Vehicles, Software (25%)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="assetCost">Asset Cost (₦)</Label>
            <Input
              id="assetCost"
              type="number"
              placeholder="e.g., 10000000"
              value={assetCost}
              onChange={(e) => setAssetCost(e.target.value)}
              disabled={loading}
              className="rounded-lg"
            />
          </div>

          <div>
            <Label htmlFor="acquisitionDate">Date of Acquisition</Label>
            <Input
              id="acquisitionDate"
              type="date"
              value={acquisitionDate}
              onChange={(e) => setAcquisitionDate(e.target.value)}
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
              className="rounded-lg"
            />
          </div>

          <Button
            onClick={calculateCapitalAllowance}
            disabled={loading || !assetType || !assetCost || !acquisitionDate}
            className="w-full btn-primary rounded-lg"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
            {loading ? 'Calculating...' : 'Calculate Allowance'}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-5 rounded-xl border border-primary-500/20 bg-primary-500/5 dark:bg-primary-500/10 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">Capital Allowance Result</h2>

          <div className="space-y-3 mb-6 text-light-text-secondary dark:text-dark-text-secondary">
            <div className="flex justify-between">
              <span className="font-medium">Asset Cost:</span>
              <span className="text-light-text-primary dark:text-dark-text-primary">{formatCurrency(result.assetCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Allowance Rate:</span>
              <span className="text-light-text-primary dark:text-dark-text-primary">{result.allowanceRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Annual Allowance:</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(result.annualAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">First Year Allowance (Pro-rated):</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(result.firstYearAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Years to Full Depreciation:</span>
              <span className="text-light-text-primary dark:text-dark-text-primary">{result.yearsToFullDepreciation} years</span>
            </div>
          </div>

          <div className="border-t border-light-border dark:border-dark-border pt-4">
            <h3 className="font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">Depreciation Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border">
                    <th className="text-left p-2 font-medium text-light-text-secondary dark:text-dark-text-secondary">Year</th>
                    <th className="text-right p-2 font-medium text-light-text-secondary dark:text-dark-text-secondary">Opening Value</th>
                    <th className="text-right p-2 font-medium text-light-text-secondary dark:text-dark-text-secondary">Allowance</th>
                    <th className="text-right p-2 font-medium text-light-text-secondary dark:text-dark-text-secondary">Closing Value</th>
                  </tr>
                </thead>
                <tbody className="text-light-text-secondary dark:text-dark-text-secondary">
                  {result.schedule.map((row) => (
                    <tr key={row.year} className="border-b border-light-border dark:border-dark-border">
                      <td className="p-2">{row.year}</td>
                      <td className="text-right p-2">{formatCurrency(row.openingValue)}</td>
                      <td className="text-right p-2 text-primary-600 dark:text-primary-400">{formatCurrency(row.allowance)}</td>
                      <td className="text-right p-2">{formatCurrency(row.closingValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button
            onClick={() => {
              if (!result) return;
              generateCalculationPDF({
                calculatorType: 'Capital Allowances Calculator',
                date: new Date().toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                inputs: {
                  asset_type: result.assetType,
                  asset_cost: result.assetCost,
                },
                results: {
                  allowance_rate: `${result.allowanceRate}%`,
                  annual_allowance: result.annualAllowance,
                  first_year_allowance: result.firstYearAllowance,
                  years_to_full_depreciation: `${result.yearsToFullDepreciation} years`,
                },
                ruleVersion: 'v1.0.0-2025-tax-act',
                sources: ['Federal Inland Revenue Service (FIRS)'],
                confidenceLevel: 'High',
              });
            }}
            className="w-full mt-4 btn-secondary rounded-lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Export as PDF
          </Button>
        </Card>
      )}

      <Card className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10">
        <h3 className="font-semibold mb-2 flex items-center text-light-text-primary dark:text-dark-text-primary">
          <InfoIcon className="mr-2 h-5 w-5 text-blue-500" />
          About This Calculator
        </h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
          This calculator implements the Nigeria Tax Act 2025 provisions for capital allowances.
          Allowance rates are fetched dynamically from the KOMPLEET Tax Rules Engine.
        </p>
        <div className="text-sm space-y-2 text-light-text-tertiary dark:text-dark-text-tertiary">
          <p>
            <strong>Data Source:</strong> Federal Inland Revenue Service (FIRS), validated by EY and KPMG analyses.
            Confidence level: {rules.rate_10_percent?.confidence || 'high'}.
          </p>
          <p>
            <strong>Disclaimer:</strong> This is an estimate. Consult a qualified Nigerian tax professional for personalized advice.
          </p>
        </div>
      </Card>
    </div>
  );
}
