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
import {
  InfoIcon,
  Calculator,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Landmark,
} from "lucide-react";
import { useTaxRules } from "@/hooks/useTaxRules";
import { logCalculation } from "@/hooks/useAuditLog";
import { generateCalculationPDF } from "@/lib/pdf-generator";
import { SaveCalculationButton } from "@/components/calculators/SaveCalculationButton";
import {
  resolveVatObligationStatus,
  type VatObligationStatus,
} from "@/lib/tax/rule-loader";
import type { LoadedRule, RuleBundle } from "@/lib/tax/types";

interface VATResult {
  /** Rent-schedule exemption only — never SME registration/filing assertion. */
  isRentExempt: boolean;
  exemptionReason: string | null;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
  obligation: VatObligationStatus;
}

/** Build a RuleBundle from the flat useTaxRules map for obligation resolution. */
function bundleFromRulesMap(
  rules: Record<string, { value: any; confidence: string; notes: string }>,
): RuleBundle {
  const map = new Map<string, LoadedRule>();
  for (const [ruleKey, rule] of Object.entries(rules)) {
    map.set(`vat.${ruleKey}`, {
      ruleType: "vat",
      ruleKey,
      value: rule.value,
      confidenceLevel: rule.confidence as LoadedRule["confidenceLevel"],
      sourceId: "",
      ruleVersionId: "",
      notes: rule.notes ?? null,
      lastReviewedAt: "",
    });
  }
  return {
    activeVersionId: null,
    unverifiedVersionId: null,
    rules: map,
  };
}

export default function VATCalculatorPage() {
  const [amount, setAmount] = useState<string>("");
  const [turnover, setTurnover] = useState<string>("");
  const [totalAssets, setTotalAssets] = useState<string>("");
  const [isRentTransaction, setIsRentTransaction] = useState<boolean>(false);
  const [calculationType, setCalculationType] = useState<"add" | "extract">(
    "add",
  );
  const [result, setResult] = useState<VATResult | null>(null);
  const [error, setError] = useState<string>("");

  const {
    rules,
    loading: rulesLoading,
    error: rulesError,
  } = useTaxRules("vat");

  // Rate calculation only needs the standard rate. Registration/filing
  // obligation is a separate, unresolved determination (ASK 1).
  const REQUIRED_RULE_KEYS = ["standard_rate"] as const;

  const missingRuleKeys = rules
    ? REQUIRED_RULE_KEYS.filter((key) => !rules[key]?.value)
    : [];
  const rulesUnavailable =
    !rulesLoading && (!!rulesError || !rules || missingRuleKeys.length > 0);

  const calculateVAT = () => {
    setError("");
    setResult(null);

    if (!rules || missingRuleKeys.length > 0) {
      setError(
        `Tax rules unavailable — cannot calculate VAT. Missing rule(s): ${
          missingRuleKeys.length > 0 ? missingRuleKeys.join(", ") : "vat.*"
        }. Please try again later or contact support.`,
      );
      return;
    }

    const amountNum = parseFloat(amount);
    const turnoverNum = parseFloat(turnover || "0");
    const assetsNum = parseFloat(totalAssets || "0");

    if (isNaN(amountNum) || amountNum < 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (isNaN(turnoverNum) || turnoverNum < 0) {
      setError("Please enter a valid turnover amount");
      return;
    }

    if (isNaN(assetsNum) || assetsNum < 0) {
      setError("Please enter a valid total assets amount");
      return;
    }

    const ratePercent = rules.standard_rate.value.rate;
    if (typeof ratePercent !== "number") {
      setError("VAT standard_rate rule is malformed — calculation blocked.");
      return;
    }
    const VAT_RATE = ratePercent / 100;

    // Rent exemption is schedule-driven and separate from the disputed SME
    // registration threshold. Only assert rent when the rent_exemption rule exists.
    let isRentExempt = false;
    let exemptionReason: string | null = null;
    if (isRentTransaction) {
      if (!rules.rent_exemption?.value?.exempt) {
        setError(
          "Rent exemption rule unavailable — cannot treat this as exempt without a verified schedule entry.",
        );
        return;
      }
      isRentExempt = true;
      exemptionReason = "Rent (land or building) is exempt from VAT";
    }

    // Obligation determination: NEVER assert register/exempt from a disputed
    // threshold. Surface all candidate readings for the practitioner.
    const obligation = resolveVatObligationStatus(
      bundleFromRulesMap(rules),
      turnoverNum,
      assetsNum,
    );

    let netAmount: number;
    let vatAmount: number;
    let grossAmount: number;

    if (isRentExempt) {
      netAmount = amountNum;
      vatAmount = 0;
      grossAmount = amountNum;
    } else if (calculationType === "add") {
      netAmount = amountNum;
      vatAmount = amountNum * VAT_RATE;
      grossAmount = netAmount + vatAmount;
    } else {
      grossAmount = amountNum;
      netAmount = amountNum / (1 + VAT_RATE);
      vatAmount = grossAmount - netAmount;
    }

    const calculationResult: VATResult = {
      isRentExempt,
      exemptionReason,
      netAmount,
      vatAmount,
      grossAmount,
      vatRate: VAT_RATE * 100,
      obligation,
    };

    setResult(calculationResult);

    logCalculation(
      "vat",
      {
        amount: amountNum,
        turnover: turnoverNum,
        totalAssets: assetsNum,
        isRentTransaction,
        calculationType,
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
        <div className="flex items-center gap-4 mb-8">
          <Landmark className="h-8 w-8 text-light-text-secondary dark:text-dark-text-secondary" />
          <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              VAT Calculator
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Calculate Value Added Tax under Nigeria Tax Act 2025
            </p>
          </div>
        </div>

        {rulesUnavailable && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300"
          >
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              {rulesError
                ? `Failed to load tax rules: ${rulesError}.`
                : `Required VAT rules are unavailable (${missingRuleKeys.join(", ") || "vat.*"}).`}{" "}
              Calculation is disabled until this is resolved.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
                Transaction Details
              </CardTitle>
              <CardDescription className="text-light-text-tertiary dark:text-dark-text-tertiary">
                Enter transaction and business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-light-text-secondary dark:text-dark-text-secondary">
                  Calculation Type
                </Label>
                <div className="flex gap-4 text-light-text-primary dark:text-dark-text-primary">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="add"
                    checked={calculationType === "add"}
                    onChange={(e) => setCalculationType("add")}
                    className="h-4 w-4 rounded-lg"
                    disabled={rulesLoading || rulesUnavailable}
                  />
                  <span>Add VAT</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="extract"
                    checked={calculationType === "extract"}
                    onChange={(e) => setCalculationType("extract")}
                    className="h-4 w-4 rounded-lg"
                    disabled={rulesLoading || rulesUnavailable}
                  />
                    <span>Extract VAT</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="amount"
                  className="text-light-text-secondary dark:text-dark-text-secondary"
                >
                  {calculationType === "add"
                    ? "Net Amount (₦)"
                    : "Gross Amount (₦)"}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={rulesLoading || rulesUnavailable}
                  className="rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="turnover"
                  className="text-light-text-secondary dark:text-dark-text-secondary"
                >
                  Annual Turnover (₦)
                </Label>
                <Input
                  id="turnover"
                  type="number"
                  placeholder="e.g., 50000000"
                  value={turnover}
                  onChange={(e) => setTurnover(e.target.value)}
                  disabled={rulesLoading || rulesUnavailable}
                  className="rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                />
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  For small business exemption check
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="assets"
                  className="text-light-text-secondary dark:text-dark-text-secondary"
                >
                  Total Assets (₦)
                </Label>
                <Input
                  id="assets"
                  type="number"
                  placeholder="e.g., 200000000"
                  value={totalAssets}
                  onChange={(e) => setTotalAssets(e.target.value)}
                  disabled={rulesLoading || rulesUnavailable}
                  className="rounded-lg bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                />
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  For small business exemption check
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rent"
                  checked={isRentTransaction}
                  onChange={(e) => setIsRentTransaction(e.target.checked)}
                  className="h-4 w-4 rounded-lg"
                  disabled={rulesLoading || rulesUnavailable}
                />
                <Label
                  htmlFor="rent"
                  className="font-normal text-light-text-primary dark:text-dark-text-primary"
                >
                  This is a rent transaction (exempt from VAT)
                </Label>
              </div>

              <Button
                onClick={calculateVAT}
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
                    Calculate VAT
                  </>
                )}
              </Button>

              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
              <CardHeader>
                <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
                  VAT Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-500 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        Standard VAT Rate
                      </p>
                      <p className="text-light-text-secondary dark:text-dark-text-secondary">
                        {rules?.standard_rate?.value?.rate != null
                          ? `${rules.standard_rate.value.rate}%`
                          : "Unavailable"}{" "}
                        (unchanged from previous law)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 text-amber-500 dark:text-amber-400" />
                    <div>
                      <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        Registration / filing obligation
                      </p>
                      <p className="text-light-text-secondary dark:text-dark-text-secondary">
                        Unverified — three mutually exclusive threshold
                        candidates are under review. VAT amount calculation
                        still uses the 7.5% rate; this calculator will not
                        assert whether you must register or file.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <XCircle className="h-4 w-4 mr-2 mt-0.5 text-orange-500 dark:text-orange-400" />
                    <div>
                      <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        Rent Exemption
                      </p>
                      <p className="text-light-text-secondary dark:text-dark-text-secondary">
                        Rent (land or building) is exempt from VAT
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                <CardHeader>
                  <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
                    VAT Calculation Result
                  </CardTitle>
                  {result.isRentExempt && (
                    <Alert className="mt-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        {result.exemptionReason}
                      </AlertDescription>
                    </Alert>
                  )}
                  {result.obligation.status === "unresolved" && (
                    <Alert className="mt-2 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-200">
                      <InfoIcon className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <p className="font-medium">
                          Registration/filing threshold unverified
                        </p>
                        <p className="text-sm">{result.obligation.reason}</p>
                        <ul className="text-sm list-disc pl-4 space-y-1">
                          {result.obligation.candidates.map((c) => (
                            <li key={c.ruleKey}>
                              <span className="font-mono text-xs">
                                {c.ruleKey}
                              </span>
                              : ₦{c.thresholdNgn.toLocaleString("en-NG")}
                              {c.assetsThresholdNgn != null
                                ? ` / assets ₦${c.assetsThresholdNgn.toLocaleString("en-NG")}`
                                : ""}{" "}
                              — {c.resultUnderThisCandidate}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 text-light-text-primary dark:text-dark-text-primary">
                  <div className="flex justify-between text-sm">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">
                      Net Amount:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(result.netAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">
                      VAT ({result.vatRate}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(result.vatAmount)}
                    </span>
                  </div>

                  <div className="border-t border-light-border dark:border-dark-border pt-2 flex justify-between font-bold text-lg">
                    <span>Gross Amount:</span>
                    <span>{formatCurrency(result.grossAmount)}</span>
                  </div>

                  {!result.isRentExempt && (
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-300">
                      <InfoIcon className="h-4 w-4" />
                      <AlertDescription>
                        VAT of {formatCurrency(result.vatAmount)}{" "}
                        {calculationType === "add"
                          ? "added to"
                          : "extracted from"}{" "}
                        the amount
                      </AlertDescription>
                    </Alert>
                  )}

                  <SaveCalculationButton
                    taxType="vat"
                    taxYear={new Date().getFullYear()}
                    inputData={{
                      amount: parseFloat(amount),
                      calculationType,
                      turnover: parseFloat(turnover) || 0,
                      totalAssets: parseFloat(totalAssets) || 0,
                      isRentTransaction,
                    }}
                    grossAmount={result.grossAmount}
                    deductions={0}
                    taxableAmount={result.netAmount}
                    taxDue={result.vatAmount}
                    effectiveRate={result.vatRate}
                    breakdown={{
                      isRentExempt: result.isRentExempt,
                      exemptionReason: result.exemptionReason,
                      netAmount: result.netAmount,
                      vatAmount: result.vatAmount,
                      obligationStatus: result.obligation.status,
                    }}
                    className="w-full mt-4 btn-primary rounded-lg"
                  />

                  <Button
                    onClick={() => {
                      if (!result) return;
                      generateCalculationPDF({
                        calculatorType: "VAT Calculator",
                        date: new Date().toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                        inputs: {
                          amount: parseFloat(amount),
                          calculation_type:
                            calculationType === "add"
                              ? "Add VAT"
                              : "Extract VAT",
                          turnover: parseFloat(turnover) || 0,
                          total_assets: parseFloat(totalAssets) || 0,
                          is_rent_transaction: isRentTransaction ? "Yes" : "No",
                        },
                        results: {
                          vat_status: result.isRentExempt
                            ? "Rent exempt"
                            : "Rate applied",
                          exemption_reason: result.exemptionReason || "N/A",
                          obligation: result.obligation.status,
                          net_amount: result.netAmount,
                          vat_amount: result.vatAmount,
                          gross_amount: result.grossAmount,
                          vat_rate: `${result.vatRate}%`,
                        },
                        ruleVersion: "v1.0.0-2025-tax-act",
                        sources: ["Nigerian Revenue Service (NRS)"],
                        confidenceLevel:
                          rules?.standard_rate?.confidence || "unavailable",
                      });
                    }}
                    variant="outline"
                    className="w-full mt-4 btn-secondary rounded-lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-6 p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <CardHeader>
            <CardTitle className="text-light-text-primary dark:text-dark-text-primary">
              About This Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-2">
            <p>
              This calculator applies the Nigeria Tax Act 2025 VAT{" "}
              <em>rate</em> from the rules engine. Registration and filing
              obligation thresholds are disputed across sources and are shown
              as unverified candidates — they do not change the VAT amount.
            </p>
            <p>
              <strong>Data Source:</strong> Nigerian Revenue Service (NRS),
              Confidence level:{" "}
              {rules?.standard_rate?.confidence || "unavailable"}.
            </p>
            <p>
              <strong>Disclaimer:</strong> This is an estimate. Consult a
              qualified Nigerian tax professional for personalized advice.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
