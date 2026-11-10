/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
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

  it("builds a send confirmation template without claiming a price or free plan", () => {
    const template = invoiceEmailTemplate({
      invoiceNumber: "INV-2026-0001",
      totalAmount: 80_625,
      businessName: "Test Traders Ltd",
    });
    expect(template.subject).toContain("INV-2026-0001");
    expect(template.text).toContain("INV-2026-0001");
    expect(template.html).toContain("INV-2026-0001");
    expect(template.subject + template.text + template.html).not.toMatch(
      /Free Beta|free plan|no-cost|₦0/i,
    );
  });
});
