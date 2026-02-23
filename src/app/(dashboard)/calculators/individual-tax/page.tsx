"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Calculator, Loader2, Download, User } from "lucide-react";
import { useTaxRules } from "@/hooks/useTaxRules";
import { logCalculation } from "@/hooks/useAuditLog";
import { generateCalculationPDF } from "@/lib/pdf-generator";
import { SaveCalculationButton } from "@/components/calculators/SaveCalculationButton";

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
  const [grossIncome, setGrossIncome] = useState<string>("");
  const [rentPaid, setRentPaid] = useState<string>("");
  const [ownerOccupierInterest, setOwnerOccupierInterest] =
    useState<string>("");
  const [result, setResult] = useState<IndividualTaxResult | null>(null);
  const [error, setError] = useState<string>("");

  const {
    rules,
    loading: rulesLoading,
    error: rulesError,
  } = useTaxRules("individual_income_tax");

  const calculateIndividualTax = () => {
    setError("");
    setResult(null);

    if (!rules) {
      setError("Tax rules are not loaded yet. Please wait...");
      return;
    }

    const grossIncomeNum = parseFloat(grossIncome);
    const rentPaidNum = parseFloat(rentPaid || "0");
    const interestNum = parseFloat(ownerOccupierInterest || "0");

    if (isNaN(grossIncomeNum) || grossIncomeNum < 0) {
      setError("Please enter a valid gross income amount");
      return;
    }

    if (isNaN(rentPaidNum) || rentPaidNum < 0) {
      setError("Please enter a valid rent amount");
      return;
    }

    if (isNaN(interestNum) || interestNum < 0) {
      setError("Please enter a valid interest amount");
      return;
    }

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

    const rentReliefCap = rules.rent_relief?.value?.cap || 500_000;
    const rentReliefPercentage =
      (rules.rent_relief?.value?.percentage || 20) / 100;
    const rentRelief = Math.min(
      rentReliefCap,
      rentPaidNum * rentReliefPercentage,
    );

    const totalDeductions = rentRelief + interestNum;
    const taxableIncome = Math.max(0, grossIncomeNum - totalDeductions);

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
    const effectiveTaxRate =
      grossIncomeNum > 0 ? (totalTax / grossIncomeNum) * 100 : 0;

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

    logCalculation(
      "individual_income_tax",
      {
        grossIncome: grossIncomeNum,
        rentPaid: rentPaidNum,
        ownerOccupierInterest: interestNum,
      },
      calculationResult,
    ).catch((err) => console.error("Failed to log calculation:", err));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center space-x-4">
          <User className="h-8 w-8 text-light-text-secondary dark:text-dark-text-secondary" />
          <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Individual Tax Calculator
            </h1>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              Calculate personal income tax under Nigeria Tax Act 2025
            </p>
          </div>
        </div>

        {rulesError && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-200"
          >
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Failed to load tax rules: {rulesError}. Using fallback rates.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
            <CardHeader className="p-0 mb-5">
              <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
                Income & Deductions
              </CardTitle>
              <CardDescription className="text-light-text-tertiary dark:text-dark-text-tertiary">
                Enter your annual income and eligible deductions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="income"
                  className="text-light-text-secondary dark:text-dark-text-secondary"
                >
                  Annual Gross Income (₦)
                </Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="e.g., 15000000"
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(e.target.value)}
                  disabled={rulesLoading}
                  className="rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="rent"
                  className="text-light-text-secondary dark:text-dark-text-secondary"
                >
                  Annual Rent Paid (₦)
                </Label>
                <Input
                  id="rent"
                  type="number"
                  placeholder="e.g., 3000000"
                  value={rentPaid}
                  onChange={(e) => setRentPaid(e.target.value)}
                  disabled={rulesLoading}
                  className="rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                />
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  Relief: ₦
                  {rules?.rent_relief?.value?.cap?.toLocaleString() ||
                    "500,000"}{" "}
                  or {rules?.rent_relief?.value?.percentage || 20}% of rent
                  (whichever is lower)
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="interest"
                  className="text-light-text-secondary dark:text-dark-text-secondary"
                >
                  Owner-Occupier Interest (₦)
                </Label>
                <Input
                  id="interest"
                  type="number"
                  placeholder="e.g., 500000"
                  value={ownerOccupierInterest}
                  onChange={(e) => setOwnerOccupierInterest(e.target.value)}
                  disabled={rulesLoading}
                  className="rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                />
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  Interest on owner-occupier house loans is fully deductible
                </p>
              </div>

              <Button
                onClick={calculateIndividualTax}
                className="w-full btn-primary rounded-lg"
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
                <Alert
                  variant="destructive"
                  className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-200"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </div>

          <div className="space-y-6">
            {result && (
              <>
                <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                  <CardHeader className="p-0 mb-5">
                    <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
                      Tax Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    <div className="flex justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <span>Gross Income:</span>
                      <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        {formatCurrency(result.grossIncome)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <span>Total Deductions:</span>
                      <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        -{formatCurrency(result.totalDeductions)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm border-t border-light-border dark:border-dark-border pt-2 text-light-text-secondary dark:text-dark-text-secondary">
                      <span>Taxable Income:</span>
                      <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        {formatCurrency(result.taxableIncome)}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold text-lg border-t border-light-border dark:border-dark-border pt-2 text-light-text-primary dark:text-dark-text-primary">
                      <span>Total Tax:</span>
                      <span className="text-red-600 dark:text-red-400">
                        {formatCurrency(result.totalTax)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <span>Net Income:</span>
                      <span className="font-medium text-primary-600">
                        {formatCurrency(result.netIncome)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      <span>Effective Tax Rate:</span>
                      <span>{result.effectiveTaxRate.toFixed(2)}%</span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                  <CardHeader className="p-0 mb-5">
                    <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
                      Tax Bracket Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-3">
                      {result.brackets.map((bracket, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between font-medium text-light-text-secondary dark:text-dark-text-secondary">
                            <span>
                              {formatCurrency(bracket.from)} -{" "}
                              {bracket.to
                                ? formatCurrency(bracket.to)
                                : "Above"}
                            </span>
                            <span>{bracket.rate}%</span>
                          </div>
                          <div className="flex justify-.between text-light-text-tertiary dark:text-dark-text-tertiary text-xs">
                            <span>
                              Taxable: {formatCurrency(bracket.taxableAmount)}
                            </span>
                            <span>
                              Tax: {formatCurrency(bracket.taxOnBracket)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <SaveCalculationButton
                  taxType="pit"
                  taxYear={new Date().getFullYear()}
                  inputData={{
                    grossIncome: parseFloat(grossIncome),
                    rentPaid: parseFloat(rentPaid) || 0,
                    ownerOccupierInterest:
                      parseFloat(ownerOccupierInterest) || 0,
                  }}
                  grossAmount={parseFloat(grossIncome)}
                  deductions={result.totalDeductions}
                  taxableAmount={result.taxableIncome}
                  taxDue={result.totalTax}
                  effectiveRate={result.effectiveTaxRate}
                  breakdown={{
                    brackets: result.brackets,
                    netIncome: result.netIncome,
                  }}
                  className="w-full btn-primary rounded-lg"
                />

                <Button
                  onClick={() => {
                    if (!result) return;
                    generateCalculationPDF({
                      calculatorType: "Individual Income Tax Calculator",
                      date: new Date().toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }),
                      inputs: {
                        gross_income: parseFloat(grossIncome),
                        rent_paid: parseFloat(rentPaid) || 0,
                        owner_occupier_interest:
                          parseFloat(ownerOccupierInterest) || 0,
                      },
                      results: {
                        taxable_income: result.taxableIncome,
                        total_tax: result.totalTax,
                        net_income: result.netIncome,
                        effective_tax_rate: `${result.effectiveTaxRate.toFixed(2)}%`,
                      },
                      ruleVersion: "v1.0.0-2025-tax-act",
                      sources: ["Nigerian Revenue Service (NRS)"],
                      confidenceLevel: "High",
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

            {!result && (
              <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                <CardHeader className="p-0 mb-5">
                  <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
                    Tax Rates (2025)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
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
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <CardHeader className="p-0 mb-5">
            <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
              About This Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-sm text-light-text-tertiary dark:text-dark-text-tertiary space-y-2">
            <p>
              This calculator implements the Nigeria Tax Act 2025 progressive
              tax rates for individuals. Tax rates and deduction limits are
              fetched dynamically from the KOMPLEET Tax Rules Engine.
            </p>
            <p>
              <strong>Data Source:</strong> Nigerian Revenue Service (NRS),
              Confidence level:{" "}
              {rules?.tax_bracket_1?.confidence || "high"}.
            </p>
            <p>
              <strong>Disclaimer:</strong> This is an estimate. Consult a
              qualified Nigerian tax professional for personalized advice.
            </p>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
