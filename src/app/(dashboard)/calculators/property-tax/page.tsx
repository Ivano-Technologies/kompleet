
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator, Download, Loader2, Building } from 'lucide-react';
import { generateCalculationPDF } from '@/lib/pdf-generator';

interface MonthlyBreakdown {
  month: number;
  grossRent: number;
  wht: number;
  netRent: number;
}

interface PropertyTaxResult {
  annualRent: number;
  whtRate: number;
  whtAmount: number;
  netRent: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export default function PropertyTaxCalculator() {
  const [annualRent, setAnnualRent] = useState('');
  const [propertyType, setPropertyType] = useState('residential');
  const [landlordType, setLandlordType] = useState('individual');
  const [result, setResult] = useState<PropertyTaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');
  
  const [rules, setRules] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setRulesLoading(true);
        const response = await fetch('/api/tax-rules?type=property_tax');
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

  const calculatePropertyTax = () => {
    if (!annualRent) {
      alert('Please enter annual rent');
      return;
    }

    setLoading(true);

    try {
      const rent = parseFloat(annualRent);
      const whtRate = rules.wht_rate?.value?.rate || 10;
      const whtAmount = rent * (whtRate / 100);
      const netRent = rent - whtAmount;

      const monthlyGrossRent = rent / 12;
      const monthlyWHT = whtAmount / 12;
      const monthlyNetRent = netRent / 12;

      const monthlyBreakdown: MonthlyBreakdown[] = [];
      for (let month = 1; month <= 12; month++) {
        monthlyBreakdown.push({
          month,
          grossRent: monthlyGrossRent,
          wht: monthlyWHT,
          netRent: monthlyNetRent,
        });
      }

      const calculationResult: PropertyTaxResult = {
        annualRent: rent,
        whtRate,
        whtAmount,
        netRent,
        monthlyBreakdown,
      };

      setResult(calculationResult);
      logCalculation(calculationResult);
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Error calculating property tax');
    } finally {
      setLoading(false);
    }
  };

  const logCalculation = async (calculationResult: PropertyTaxResult) => {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculationType: 'property_tax',
          inputData: {
            annualRent: parseFloat(annualRent),
            propertyType,
            landlordType,
          },
          outputData: {
            whtRate: calculationResult.whtRate,
            whtAmount: calculationResult.whtAmount,
            netRent: calculationResult.netRent,
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

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  if (rulesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-light-text-primary dark:text-dark-text-primary" />
            <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Loading tax rules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <Building className="h-8 w-8 text-light-text-primary dark:text-dark-text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Property Tax Calculator</h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Calculate withholding tax (WHT) on rental income under Nigeria Tax Act 2025
          </p>
        </div>
      </div>

      {rulesError && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            {rulesError}. Using fallback rate: 10% WHT.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">Rental Information</h2>
        <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-4">Enter your rental property details</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="annualRent">Annual Rent (₦)</Label>
            <Input
              id="annualRent"
              type="number"
              placeholder="e.g., 6000000"
              value={annualRent}
              onChange={(e) => setAnnualRent(e.target.value)}
              disabled={loading}
              className="rounded-lg"
            />
          </div>

          <div>
            <Label htmlFor="propertyType">Property Type</Label>
            <select
              id="propertyType"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary"
              disabled={loading}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <div>
            <Label htmlFor="landlordType">Landlord Type</Label>
            <select
              id="landlordType"
              value={landlordType}
              onChange={(e) => setLandlordType(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary"
              disabled={loading}
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </div>

          <Button
            onClick={calculatePropertyTax}
            disabled={loading || !annualRent}
            className="w-full btn-primary rounded-lg"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
            {loading ? 'Calculating...' : 'Calculate WHT'}
          </Button>
        </div>
      </Card>

      {result && (
        <>
          <Card className="p-5 rounded-xl border border-primary-500/20 bg-primary-500/10 dark:bg-primary-500/10 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-primary-700 dark:text-primary-300">Property Tax (WHT) Result</h2>

            <div className="space-y-3 mb-6 text-light-text-primary dark:text-dark-text-primary">
              <div className="flex justify-between">
                <span className="font-medium">Gross Annual Rent:</span>
                <span>{formatCurrency(result.annualRent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">WHT Rate:</span>
                <span>{result.whtRate}%</span>
              </div>
              <div className="flex justify-between border-t border-light-border dark:border-dark-border pt-3">
                <span className="font-bold text-lg">WHT Amount (Annual):</span>
                <span className="font-bold text-lg text-red-700 dark:text-red-400">{formatCurrency(result.whtAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-lg">Net Rent (After WHT):</span>
                <span className="font-bold text-lg text-green-700 dark:text-green-400">{formatCurrency(result.netRent)}</span>
              </div>
            </div>

            <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> The tenant is responsible for withholding the WHT and remitting
                it to FIRS on behalf of the landlord.
              </AlertDescription>
            </Alert>
          </Card>

          <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
            <h3 className="font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border">
                    <th className="text-left p-2 font-medium">Month</th>
                    <th className="text-right p-2 font-medium">Gross Rent</th>
                    <th className="text-right p-2 font-medium">WHT ({result.whtRate}%)</th>
                    <th className="text-right p-2 font-medium">Net Rent</th>
                  </tr>
                </thead>
                <tbody>
                  {result.monthlyBreakdown.map((row) => (
                    <tr key={row.month} className="border-b border-light-border dark:border-dark-border">
                      <td className="p-2">{getMonthName(row.month)}</td>
                      <td className="text-right p-2">{formatCurrency(row.grossRent)}</td>
                      <td className="text-right p-2 text-red-600 dark:text-red-400">{formatCurrency(row.wht)}</td>
                      <td className="text-right p-2 text-green-600 dark:text-green-400">{formatCurrency(row.netRent)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary">
                    <td className="p-2">Total</td>
                    <td className="text-right p-2">{formatCurrency(result.annualRent)}</td>
                    <td className="text-right p-2">{formatCurrency(result.whtAmount)}</td>
                    <td className="text-right p-2">{formatCurrency(result.netRent)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Button
            onClick={() => {
              if (!result) return;
              generateCalculationPDF({
                calculatorType: 'Property Tax (WHT) Calculator',
                date: new Date().toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                inputs: {
                  annual_rent: result.annualRent,
                },
                results: {
                  wht_rate: `${result.whtRate}%`,
                  wht_amount: result.whtAmount,
                  net_rent: result.netRent,
                },
                ruleVersion: 'v1.0.0-2025-tax-act',
                sources: ['Nigerian Revenue Service (NRS)'],
                confidenceLevel: 'High',
              });
            }}
            variant="outline"
            className="w-full btn-secondary rounded-lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Export as PDF
          </Button>
        </>
      )}

      <Card className="p-5 rounded-xl mt-6 border-blue-500/20 bg-blue-50 dark:bg-blue-900/10">
        <h3 className="font-semibold mb-2 flex items-center text-blue-800 dark:text-blue-200">
          <InfoIcon className="mr-2 h-5 w-5" />
          About This Calculator
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300/80 mb-4">
          This calculator implements the Nigeria Tax Act 2025 provisions for withholding tax on rent.
          The WHT rate is fetched dynamically from the KOMPLEET Tax Rules Engine.
        </p>
        <div className="text-sm space-y-2 text-blue-700/90 dark:text-blue-300/70">
          <p>
            <strong>WHT on Rent:</strong> {rules.wht_rate?.value?.rate || 10}% of gross rent
          </p>
          <p>
            <strong>Responsibility:</strong> The tenant must withhold the WHT from rent payments and remit
            it to FIRS using the appropriate remittance form.
          </p>
          <p>
            <strong>Remittance:</strong> WHT should be remitted to FIRS within 21 days of the end of the
            month in which the rent was paid.
          </p>
          <p className="mt-4">
            <strong>Data Source:</strong> Nigerian Revenue Service (NRS), validated by EY and KPMG analyses.
            Confidence level: {rules.wht_rate?.confidence || 'high'}.
          </p>
          <p>
            <strong>Disclaimer:</strong> This is an estimate. Consult a qualified Nigerian tax professional for personalized advice.
          </p>
        </div>
      </Card>
    </div>
  );
}
