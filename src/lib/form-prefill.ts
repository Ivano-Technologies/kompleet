/**
 * Form Pre-fill Service
 * Sprint 7: Phase 2 Enhancement
 * Auto-populates NRS forms with user data from Supabase
 */

import { createServerClient as createClient } from '@/lib/supabase/server';
import { PITFormData, CITFormData, VATFormData } from './nrs-forms';

/**
 * Calculate PIT (Personal Income Tax) based on Nigeria Tax Act 2025
 */
function calculatePIT(grossIncome: number): {
  consolidatedRelief: number;
  taxableIncome: number;
  taxPayable: number;
} {
  // Consolidated Relief: Higher of 1% of gross income or ₦200,000 + 20% of gross income
  const onePercent = grossIncome * 0.01;
  const twentyPercent = grossIncome * 0.20;
  const consolidatedRelief = Math.max(onePercent, 200000 + twentyPercent);

  // Taxable Income
  const taxableIncome = Math.max(0, grossIncome - consolidatedRelief);

  // Progressive Tax Rates (Nigeria Tax Act 2025)
  let taxPayable = 0;
  const brackets = [
    { limit: 300000, rate: 0.07 },
    { limit: 300000, rate: 0.11 },
    { limit: 500000, rate: 0.15 },
    { limit: 500000, rate: 0.19 },
    { limit: 1600000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 }
  ];

  let remaining = taxableIncome;
  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const taxableAmount = Math.min(remaining, bracket.limit);
    taxPayable += taxableAmount * bracket.rate;
    remaining -= taxableAmount;
  }

  return {
    consolidatedRelief,
    taxableIncome,
    taxPayable
  };
}

/**
 * Calculate CIT (Company Income Tax) based on Nigeria Tax Act 2025
 */
function calculateCIT(turnover: number, profitBeforeTax: number): {
  taxRate: number;
  taxPayable: number;
} {
  // Tiered CIT Rates (Nigeria Tax Act 2025)
  let taxRate: number;
  
  if (turnover <= 25000000) {
    taxRate = 0; // 0% for turnover ≤ ₦25M
  } else if (turnover <= 100000000) {
    taxRate = 20; // 20% for turnover ₦25M - ₦100M
  } else {
    taxRate = 25; // 25% for turnover > ₦100M
  }

  const taxPayable = (profitBeforeTax * taxRate) / 100;

  return {
    taxRate,
    taxPayable
  };
}

/**
 * Calculate VAT (Value Added Tax)
 */
function calculateVAT(outputVAT: number, inputVAT: number): {
  netVAT: number;
  totalDue: number;
} {
  const netVAT = outputVAT - inputVAT;
  const totalDue = Math.max(0, netVAT); // No negative VAT

  return {
    netVAT,
    totalDue
  };
}

/**
 * Pre-fill PIT Form Data
 */
export async function prefillPITForm(userId: string, taxYear: number): Promise<PITFormData | null> {
  try {
    const supabase = await createClient();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    // Fetch transactions for the tax year
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${taxYear}-01-01`)
      .lte('date', `${taxYear}-12-31`);

    if (txError) {
      console.error('Transactions fetch error:', txError);
      return null;
    }

    // Calculate gross income from transactions
    const grossIncome = transactions
      ?.filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

    // Calculate withholding tax (assume 10% of gross income as WHT)
    const withholdingTax = grossIncome * 0.10;

    // Calculate PIT
    const { consolidatedRelief, taxableIncome, taxPayable } = calculatePIT(grossIncome);
    const balanceDue = taxPayable - withholdingTax;

    return {
      taxpayerName: profile.full_name || 'N/A',
      tin: profile.tin || 'N/A',
      address: profile.address || 'N/A',
      phone: profile.phone || 'N/A',
      email: profile.email || 'N/A',
      taxYear,
      grossIncome,
      consolidatedRelief,
      otherReliefs: 0,
      taxableIncome,
      taxPayable,
      withholdingTax,
      balanceDue
    };

  } catch (error) {
    console.error('PIT prefill error:', error);
    return null;
  }
}

/**
 * Pre-fill CIT Form Data
 */
export async function prefillCITForm(userId: string, taxYear: number): Promise<CITFormData | null> {
  try {
    const supabase = await createClient();

    // Fetch company profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    // Fetch transactions for the tax year
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${taxYear}-01-01`)
      .lte('date', `${taxYear}-12-31`);

    if (txError) {
      console.error('Transactions fetch error:', txError);
      return null;
    }

    // Calculate turnover (total income)
    const turnover = transactions
      ?.filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

    // Calculate expenses
    const expenses = transactions
      ?.filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

    // Assume cost of sales is 60% of turnover
    const costOfSales = turnover * 0.60;
    const grossProfit = turnover - costOfSales;

    // Operating expenses (actual expenses from transactions)
    const operatingExpenses = expenses;
    const profitBeforeTax = Math.max(0, grossProfit - operatingExpenses);

    // Assume capital allowances (10% of profit)
    const capitalAllowances = profitBeforeTax * 0.10;
    const taxableProfit = Math.max(0, profitBeforeTax - capitalAllowances);

    // Calculate CIT
    const { taxRate, taxPayable } = calculateCIT(turnover, taxableProfit);

    // Assume advance payments (25% of tax payable)
    const advancePayments = taxPayable * 0.25;
    const balanceDue = taxPayable - advancePayments;

    return {
      companyName: profile.company_name || profile.full_name || 'N/A',
      rcNumber: profile.rc_number || 'N/A',
      tin: profile.tin || 'N/A',
      address: profile.address || 'N/A',
      phone: profile.phone || 'N/A',
      email: profile.email || 'N/A',
      taxYear,
      turnover,
      costOfSales,
      grossProfit,
      operatingExpenses,
      profitBeforeTax,
      capitalAllowances,
      taxableProfit,
      taxRate,
      taxPayable,
      advancePayments,
      balanceDue
    };

  } catch (error) {
    console.error('CIT prefill error:', error);
    return null;
  }
}

/**
 * Pre-fill VAT Form Data
 */
export async function prefillVATForm(
  userId: string,
  taxYear: number,
  quarter: 1 | 2 | 3 | 4
): Promise<VATFormData | null> {
  try {
    const supabase = await createClient();

    // Fetch business profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    // Determine quarter date range
    const quarterRanges = {
      1: { start: `${taxYear}-01-01`, end: `${taxYear}-03-31`, label: 'Q1 (Jan-Mar)' },
      2: { start: `${taxYear}-04-01`, end: `${taxYear}-06-30`, label: 'Q2 (Apr-Jun)' },
      3: { start: `${taxYear}-07-01`, end: `${taxYear}-09-30`, label: 'Q3 (Jul-Sep)' },
      4: { start: `${taxYear}-10-01`, end: `${taxYear}-12-31`, label: 'Q4 (Oct-Dec)' }
    };

    const range = quarterRanges[quarter];

    // Fetch transactions for the quarter
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', range.start)
      .lte('date', range.end);

    if (txError) {
      console.error('Transactions fetch error:', txError);
      return null;
    }

    // Calculate sales (income)
    const sales = transactions
      ?.filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

    // Calculate purchases (expenses)
    const purchases = transactions
      ?.filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

    // Calculate VAT (7.5%)
    const outputVAT = sales * 0.075;
    const inputVAT = purchases * 0.075;
    const { netVAT, totalDue } = calculateVAT(outputVAT, inputVAT);

    return {
      businessName: profile.company_name || profile.full_name || 'N/A',
      tin: profile.tin || 'N/A',
      address: profile.address || 'N/A',
      phone: profile.phone || 'N/A',
      email: profile.email || 'N/A',
      period: range.label,
      taxYear,
      outputVAT,
      inputVAT,
      netVAT,
      penaltyIfAny: 0,
      totalDue
    };

  } catch (error) {
    console.error('VAT prefill error:', error);
    return null;
  }
}

/**
 * Validate form data before PDF generation
 */
export function validatePITForm(data: PITFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.taxpayerName || data.taxpayerName === 'N/A') {
    errors.push('Taxpayer name is required');
  }
  if (!data.tin || data.tin === 'N/A' || data.tin.length < 10) {
    errors.push('Valid TIN (Tax Identification Number) is required');
  }
  if (!data.address || data.address === 'N/A') {
    errors.push('Address is required');
  }
  if (data.grossIncome < 0) {
    errors.push('Gross income cannot be negative');
  }
  if (data.taxableIncome < 0) {
    errors.push('Taxable income cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateCITForm(data: CITFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.companyName || data.companyName === 'N/A') {
    errors.push('Company name is required');
  }
  if (!data.tin || data.tin === 'N/A' || data.tin.length < 10) {
    errors.push('Valid TIN is required');
  }
  if (!data.rcNumber || data.rcNumber === 'N/A') {
    errors.push('RC Number is required');
  }
  if (data.turnover < 0) {
    errors.push('Turnover cannot be negative');
  }
  if (data.profitBeforeTax < 0) {
    errors.push('Profit before tax cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateVATForm(data: VATFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.businessName || data.businessName === 'N/A') {
    errors.push('Business name is required');
  }
  if (!data.tin || data.tin === 'N/A' || data.tin.length < 10) {
    errors.push('Valid TIN is required');
  }
  if (data.outputVAT < 0) {
    errors.push('Output VAT cannot be negative');
  }
  if (data.inputVAT < 0) {
    errors.push('Input VAT cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
