/**
 * Form Pre-fill Service
 * Sprint 7: Phase 2 Enhancement
 * Auto-populates NRS forms. Prefill writers were leftover Supabase and are
 * stubs after the Phase 5 strip; validators stay for tests / NRS forms.
 */

import { PITFormData, CITFormData, VATFormData } from "./nrs-forms";

/**
 * Pre-fill PIT Form Data
 */
export async function prefillPITForm(
  _userId: string,
  _taxYear: number,
): Promise<PITFormData | null> {
  return null;
}

/**
 * Pre-fill CIT Form Data
 */
export async function prefillCITForm(
  _userId: string,
  _taxYear: number,
): Promise<CITFormData | null> {
  return null;
}

/**
 * Pre-fill VAT Form Data
 */
export async function prefillVATForm(
  _userId: string,
  _taxYear: number,
  _quarter: 1 | 2 | 3 | 4,
): Promise<VATFormData | null> {
  return null;
}

/**
 * Validate form data before PDF generation
 */
export function validatePITForm(data: PITFormData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.taxpayerName || data.taxpayerName === "N/A") {
    errors.push("Taxpayer name is required");
  }
  if (!data.tin || data.tin === "N/A" || data.tin.length < 10) {
    errors.push("Valid TIN (Tax Identification Number) is required");
  }
  if (!data.address || data.address === "N/A") {
    errors.push("Address is required");
  }
  if (data.grossIncome < 0) {
    errors.push("Gross income cannot be negative");
  }
  if (data.taxableIncome < 0) {
    errors.push("Taxable income cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCITForm(data: CITFormData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.companyName || data.companyName === "N/A") {
    errors.push("Company name is required");
  }
  if (!data.tin || data.tin === "N/A" || data.tin.length < 10) {
    errors.push("Valid TIN is required");
  }
  if (!data.rcNumber || data.rcNumber === "N/A") {
    errors.push("RC Number is required");
  }
  if (data.turnover < 0) {
    errors.push("Turnover cannot be negative");
  }
  if (data.profitBeforeTax < 0) {
    errors.push("Profit before tax cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateVATForm(data: VATFormData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.businessName || data.businessName === "N/A") {
    errors.push("Business name is required");
  }
  if (!data.tin || data.tin === "N/A" || data.tin.length < 10) {
    errors.push("Valid TIN is required");
  }
  if (data.outputVAT < 0) {
    errors.push("Output VAT cannot be negative");
  }
  if (data.inputVAT < 0) {
    errors.push("Input VAT cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
