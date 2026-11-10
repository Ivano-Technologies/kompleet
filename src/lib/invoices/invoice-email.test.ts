/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  INVOICE_EMAIL_NEEDS_BUSINESS,
  INVOICE_EMAIL_REPLY_PROMPT,
  formatInvoiceNaira,
  invoiceBusinessName,
  invoiceEmailTemplate,
  invoiceRecipientEmail,
} from "./invoice-email";

describe("invoice email helpers", () => {
  it("reads a client email and ignores empty or malformed values", () => {
    expect(
      invoiceRecipientEmail({ name: "Fixture Client Ltd", email: "billing@fixture.test" }),
    ).toBe("billing@fixture.test");
    expect(invoiceRecipientEmail({ name: "Fixture Client Ltd", email: "  " })).toBeNull();
    expect(invoiceRecipientEmail({ name: "Fixture Client Ltd" })).toBeNull();
    expect(invoiceRecipientEmail(null)).toBeNull();
  });

  it("requires a real business name and never falls back to your supplier", () => {
    expect(invoiceBusinessName({ name: "Test Traders Ltd" })).toBe("Test Traders Ltd");
    expect(invoiceBusinessName({ legalName: "Test Traders Ltd" })).toBe("Test Traders Ltd");
    expect(invoiceBusinessName({ name: "  " })).toBeNull();
    expect(invoiceBusinessName(null)).toBeNull();
    expect(INVOICE_EMAIL_NEEDS_BUSINESS).toMatch(/business name/i);
    expect(() =>
      invoiceEmailTemplate({
        invoiceNumber: "INV-001",
        totalAmount: 1000,
        businessName: "  ",
      }),
    ).toThrow(/business name/i);
  });

  it("wording does not promise a Kompleet view or an undelivered PDF", () => {
    const template = invoiceEmailTemplate({
      invoiceNumber: "INV-001",
      totalAmount: 80_625,
      businessName: "Test Traders Ltd",
      includeReplyPrompt: true,
    });
    expect(template.text).toBe(
      `Invoice INV-001 for ₦80,625.00 from Test Traders Ltd is ready. ${INVOICE_EMAIL_REPLY_PROMPT}`,
    );
    expect(template.subject).toBe("Invoice INV-001 from Test Traders Ltd");
    expect(template.html).toContain("INV-001");
    expect(template.subject + template.text + template.html).not.toMatch(
      /your supplier|Kompleet|Free Beta|free plan|no-cost|₦0/i,
    );
    expect(formatInvoiceNaira(80_625)).toBe("₦80,625.00");
  });

  it("omits the reply sentence when there is no owner reply-to", () => {
    const template = invoiceEmailTemplate({
      invoiceNumber: "INV-001",
      totalAmount: 80_625,
      businessName: "Test Traders Ltd",
      attachedPdf: true,
    });
    expect(template.text).toBe(
      "Invoice INV-001 for ₦80,625.00 from Test Traders Ltd is ready. The invoice PDF is attached.",
    );
    expect(template.text).not.toContain(INVOICE_EMAIL_REPLY_PROMPT);
    expect(template.html).not.toContain(INVOICE_EMAIL_REPLY_PROMPT);
  });

  it("mentions the PDF only when one is attached", () => {
    const withPdf = invoiceEmailTemplate({
      invoiceNumber: "INV-001",
      totalAmount: 80_625,
      businessName: "Test Traders Ltd",
      attachedPdf: true,
      includeReplyPrompt: true,
    });
    expect(withPdf.text).toContain("The invoice PDF is attached.");
    expect(withPdf.text).toContain(INVOICE_EMAIL_REPLY_PROMPT);
    expect(withPdf.text).not.toMatch(/your supplier|Open the invoice in Kompleet/i);
  });
});
