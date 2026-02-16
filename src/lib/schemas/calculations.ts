import { z } from 'zod';

export const taxTypeEnum = z.enum(['pit', 'cit', 'vat', 'wht']);

export const saveCalculationSchema = z.object({
  tax_type: taxTypeEnum,
  tax_year: z.number().int().min(2000).max(2100),
  calculation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  input_data: z.record(z.string(), z.any()),
  gross_amount: z.number().min(0, 'Amounts must be non-negative'),
  deductions: z.number().min(0, 'Amounts must be non-negative').optional(),
  taxable_amount: z.number().min(0, 'Amounts must be non-negative'),
  tax_due: z.number().min(0, 'Amounts must be non-negative'),
  effective_rate: z.number().min(0).max(100).nullable().optional(),
  breakdown: z.record(z.string(), z.any()),
  is_final: z.boolean().optional(),
});

export const updateCalculationSchema = z.object({
  input_data: z.record(z.string(), z.any()).optional(),
  gross_amount: z.number().min(0, 'Amounts must be non-negative').optional(),
  deductions: z.number().min(0, 'Amounts must be non-negative').optional(),
  taxable_amount: z.number().min(0, 'Amounts must be non-negative').optional(),
  tax_due: z.number().min(0, 'Amounts must be non-negative').optional(),
  effective_rate: z.number().min(0).max(100).nullable().optional(),
  breakdown: z.record(z.string(), z.any()).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'No valid fields to update' }
);

export type SaveCalculationInput = z.infer<typeof saveCalculationSchema>;
export type UpdateCalculationInput = z.infer<typeof updateCalculationSchema>;
