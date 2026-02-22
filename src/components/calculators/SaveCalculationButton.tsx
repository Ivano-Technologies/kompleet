"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SaveCalculationButtonProps {
  taxType: "pit" | "cit" | "vat" | "wht";
  taxYear: number;
  inputData: Record<string, any>;
  grossAmount: number;
  deductions?: number;
  taxableAmount: number;
  taxDue: number;
  effectiveRate?: number;
  breakdown: Record<string, any>;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
}

export function SaveCalculationButton({
  taxType,
  taxYear,
  inputData,
  grossAmount,
  deductions = 0,
  taxableAmount,
  taxDue,
  effectiveRate,
  breakdown,
  variant = "default",
  className = "",
}: SaveCalculationButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Convert amounts to kobo (multiply by 100)
      const response = await fetch("/api/calculations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tax_type: taxType,
          tax_year: taxYear,
          input_data: inputData,
          gross_amount: Math.round(grossAmount * 100), // Convert to kobo
          deductions: Math.round(deductions * 100),
          taxable_amount: Math.round(taxableAmount * 100),
          tax_due: Math.round(taxDue * 100),
          effective_rate: effectiveRate || null,
          breakdown,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save calculation");
      }

      setSaved(true);
      // Reset saved state after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error("[Save Calculation Error]", error);
      setError(
        error.message || "Failed to save calculation. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleSave}
        variant={variant}
        className={className}
        disabled={saving || saved}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save to Account
          </>
        )}
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
