import { describe, it, expect } from "vitest";
import { createInvoiceSchema } from "./invoices";

// ── Helpers ──────────────────────────────────────────────────────────────────

function validInvoice(overrides: Record<string, unknown> = {}) {
  return {
    customer_info: {
      name: "Acme Ltd",
      email: "billing@acme.ng",
      address: "12 Marina Road, Lagos",
    },
    line_items: [
      {
        description: "Consulting services",
        quantity: 10,
        unit_price: 25000,
        amount: 250000,
        tax_rate: 7.5,
      },
    ],
    invoice_date: "2026-01-15",
    due_date: "2026-02-15",
    payment_terms: "Net 30",
    notes: "Thank you for your business",
    tax_year: 2026,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("createInvoiceSchema", () => {
  // 1. Valid invoice passes
  it("accepts a fully valid invoice", () => {
    const result = createInvoiceSchema.safeParse(validInvoice());
    expect(result.success).toBe(true);
  });

  it("accepts a minimal valid invoice (only required fields)", () => {
    const result = createInvoiceSchema.safeParse({
      customer_info: { name: "Jane Doe" },
      line_items: [{ description: "Item", quantity: 1, unit_price: 100 }],
    });
    expect(result.success).toBe(true);
  });

  // 2. Missing customer_info fails
  it("rejects an invoice without customer_info", () => {
    const { customer_info, ...rest } = validInvoice();
    const result = createInvoiceSchema.safeParse(rest);

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("customer_info");
    }
  });

  it("rejects customer_info with empty name", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({ customer_info: { name: "" } }),
    );
    expect(result.success).toBe(false);
  });

  // 3. Empty line_items array fails
  it("rejects an invoice with an empty line_items array", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({ line_items: [] }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => /at least one/i.test(m))).toBe(true);
    }
  });

  it("rejects an invoice without the line_items field", () => {
    const { line_items, ...rest } = validInvoice();
    const result = createInvoiceSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // 4. Invalid email format fails
  it("rejects an invalid email address", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({
        customer_info: { name: "Acme Ltd", email: "not-an-email" },
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("customer_info.email");
    }
  });

  it("accepts an empty-string email (allowed by schema)", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({
        customer_info: { name: "Acme Ltd", email: "" },
      }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts customer_info without an email (optional)", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({
        customer_info: { name: "Acme Ltd" },
      }),
    );
    expect(result.success).toBe(true);
  });

  // 5. Invalid date format fails
  it("rejects an invoice_date that does not match YYYY-MM-DD", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({ invoice_date: "15/01/2026" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("invoice_date");
    }
  });

  it("rejects a due_date with wrong format", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({ due_date: "Jan 15, 2026" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("due_date");
    }
  });

  it("accepts dates omitted entirely (optional)", () => {
    const invoice = validInvoice();
    delete (invoice as any).invoice_date;
    delete (invoice as any).due_date;
    const result = createInvoiceSchema.safeParse(invoice);
    expect(result.success).toBe(true);
  });

  // 6. Quantity of 0 or negative fails
  it("rejects a line item with quantity of 0", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({
        line_items: [{ description: "Item", quantity: 0, unit_price: 100 }],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("line_items.0.quantity");
    }
  });

  it("rejects a line item with negative quantity", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({
        line_items: [{ description: "Item", quantity: -5, unit_price: 100 }],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => /positive/i.test(m))).toBe(true);
    }
  });

  it("rejects a line item with negative unit_price", () => {
    const result = createInvoiceSchema.safeParse(
      validInvoice({
        line_items: [{ description: "Item", quantity: 1, unit_price: -50 }],
      }),
    );

    expect(result.success).toBe(false);
  });
});
