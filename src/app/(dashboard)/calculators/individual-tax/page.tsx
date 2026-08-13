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

  const REQUIRED_RULE_KEYS = [
    "tax_bracket_1",
    "tax_bracket_2",
    "tax_bracket_3",
    "tax_bracket_4",
    "tax_bracket_5",
    "tax_bracket_6",
    "rent_relief",
  ] as const;

  const missingRuleKeys = rules
    ? REQUIRED_RULE_KEYS.filter((key) => !rules[key]?.value)
    : [];
  const rulesUnavailable =
    !rulesLoading && (!!rulesError || !rules || missingRuleKeys.length > 0);

  const calculateIndividualTax = () => {
    setError("");
    setResult(null);

    if (!rules || missingRuleKeys.length > 0) {
      setError(
        `Tax rules unavailable — cannot calculate individual tax. Missing rule(s): ${
          missingRuleKeys.length > 0
            ? missingRuleKeys.join(", ")
            : "individual_income_tax.*"
        }. Please try again later or contact support.`,
      );
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
      rules.tax_bracket_1,
      rules.tax_bracket_2,
      rules.tax_bracket_3,
      rules.tax_bracket_4,
      rules.tax_bracket_5,
      rules.tax_bracket_6,
    ].map((bracket) => ({
      from: bracket.value.from,
      to: bracket.value.to,
      rate: bracket.value.rate / 100,
    }));

    const rentReliefCap = rules.rent_relief.value.cap;
    const rentReliefPercentage = rules.rent_relief.value.percentage / 100;
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

        {rulesUnavailable && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-200"
          >
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              {rulesError
                ? `Failed to load tax rules: ${rulesError}.`
                : `Required individual tax rules are unavailable (${missingRuleKeys.join(", ") || "individual_income_tax.*"}).`}{" "}
              Calculation is disabled until this is resolved.
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
                  disabled={rulesLoading || rulesUnavailable}
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
                  disabled={rulesLoading || rulesUnavailable}
                  className="rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                />
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  {rules?.rent_relief?.value?.cap != null &&
                  rules?.rent_relief?.value?.percentage != null
                    ? `Relief: ₦${rules.rent_relief.value.cap.toLocaleString()} or ${rules.rent_relief.value.percentage}% of rent (whichever is lower)`
                    : "Relief amount unavailable — tax rules not loaded"}
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
                  disabled={rulesLoading || rulesUnavailable}
                  className="rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                />
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  Interest on owner-occupier house loans is fully deductible
                </p>
              </div>

              <Button
                onClick={calculateIndividualTax}
                className="w-full btn-primary rounded-lg"
                disabled={rulesLoading || rulesUnavailable}
              >
                {rulesLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Rules...
                  </>
                ) : rulesUnavailable ? (
                  <>
                    <InfoIcon className="mr-2 h-4 w-4" />
                    Rules Unavailable
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
                      confidenceLevel:
                        rules?.tax_bracket_1?.confidence || "unavailable",
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
                  {rulesUnavailable ? (
                    <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      Tax bracket rates are unavailable — tax rules failed to
                      load.
                    </p>
                  ) : (
                    <div className="space-y-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {(
                        [
                          "tax_bracket_1",
                          "tax_bracket_2",
                          "tax_bracket_3",
                          "tax_bracket_4",
                          "tax_bracket_5",
                          "tax_bracket_6",
                        ] as const
                      ).map((key) => {
                        const bracket = rules?.[key]?.value;
                        if (!bracket) return null;
                        return (
                          <p key={key} className="flex justify-between">
                            <span>
                              {bracket.to
                                ? `₦${bracket.from.toLocaleString()} - ₦${bracket.to.toLocaleString()}`
                                : `Above ₦${bracket.from.toLocaleString()}`}
                            </span>
                            <span className="font-medium">
                              {bracket.rate}%
                            </span>
                          </p>
                        );
                      })}
                    </div>
                  )}
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
              {rules?.tax_bracket_1?.confidence || "unavailable"}.
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
