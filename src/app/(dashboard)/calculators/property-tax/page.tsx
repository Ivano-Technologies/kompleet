'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Calculator } from 'lucide-react';

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
  
  // Tax rules from database
  const [rules, setRules] = useState<Record<string, any>>({});

  // Fetch tax rules on component mount
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

      // Generate monthly breakdown
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

      // Log calculation to audit trail
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
        <h1 className="text-3xl font-bold mb-2">Property Tax Calculator</h1>
        <p className="text-gray-600">
          Calculate withholding tax (WHT) on rental income under Nigeria Tax Act 2025
        </p>
      </div>

      {rulesError && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            {rulesError}. Using fallback rate: 10% WHT.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Rental Information</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your rental property details</p>

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
            />
          </div>

          <div>
            <Label htmlFor="propertyType">Property Type</Label>
            <select
              id="propertyType"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
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
              className="w-full mt-1 p-2 border rounded-md"
              disabled={loading}
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </div>

          <Button
            onClick={calculatePropertyTax}
            disabled={loading || !annualRent}
            className="w-full"
          >
            <Calculator className="mr-2 h-4 w-4" />
            {loading ? 'Calculating...' : 'Calculate WHT'}
          </Button>
        </div>
      </Card>

      {result && (
        <>
          <Card className="p-6 mb-6 bg-green-50 border-green-200">
            <h2 className="text-xl font-semibold mb-4">Property Tax (WHT) Result</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="font-medium">Gross Annual Rent:</span>
                <span>{formatCurrency(result.annualRent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">WHT Rate:</span>
                <span>{result.whtRate}%</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold text-lg">WHT Amount (Annual):</span>
                <span className="font-bold text-lg text-red-700">{formatCurrency(result.whtAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-lg">Net Rent (After WHT):</span>
                <span className="font-bold text-lg text-green-700">{formatCurrency(result.netRent)}</span>
              </div>
            </div>

            <Alert className="border-blue-500 bg-blue-100">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> The tenant is responsible for withholding the WHT and remitting
                it to FIRS on behalf of the landlord.
              </AlertDescription>
            </Alert>
          </Card>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-3">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Month</th>
                    <th className="text-right p-2">Gross Rent</th>
                    <th className="text-right p-2">WHT (10%)</th>
                    <th className="text-right p-2">Net Rent</th>
                  </tr>
                </thead>
                <tbody>
                  {result.monthlyBreakdown.map((row) => (
                    <tr key={row.month} className="border-b">
                      <td className="p-2">{getMonthName(row.month)}</td>
                      <td className="text-right p-2">{formatCurrency(row.grossRent)}</td>
                      <td className="text-right p-2">{formatCurrency(row.wht)}</td>
                      <td className="text-right p-2">{formatCurrency(row.netRent)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2">
                    <td className="p-2">Total</td>
                    <td className="text-right p-2">{formatCurrency(result.annualRent)}</td>
                    <td className="text-right p-2">{formatCurrency(result.whtAmount)}</td>
                    <td className="text-right p-2">{formatCurrency(result.netRent)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 flex items-center">
          <InfoIcon className="mr-2 h-5 w-5" />
          About This Calculator
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          This calculator implements the Nigeria Tax Act 2025 provisions for withholding tax on rent.
          The WHT rate is fetched dynamically from the KOMPLEET Tax Rules Engine.
        </p>
        <div className="text-sm space-y-2">
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
            <strong>Data Source:</strong> Federal Inland Revenue Service (FIRS), validated by EY and KPMG analyses.
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
