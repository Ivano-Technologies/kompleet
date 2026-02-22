import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.number().positive("Quantity must be positive"),
  unit_price: z.number().min(0, "Unit price must be non-negative"),
  amount: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
});

const customerInfoSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(200),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  tin: z.string().max(50).optional(),
});

export const createInvoiceSchema = z.object({
  tax_year: z.number().int().min(2000).max(2100).optional(),
  customer_info: customerInfoSchema,
  line_items: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
  invoice_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
  payment_terms: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
