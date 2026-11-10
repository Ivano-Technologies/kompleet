/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { INV_COPY } from "./invoice-copy";

describe("invoice send / issue confirmation copy", () => {
  it("has distinct View invoice vs Send/Issue labels and a sent-email confirmation", () => {
    expect(INV_COPY.openInvoice).toBe("View invoice");
    expect(INV_COPY.sendInvoice).toBe("Send");
    expect(INV_COPY.sendConfirmTitle("INV-001", "ada@x.com")).toBe(
      "Send INV-001 to ada@x.com?",
    );
    expect(INV_COPY.sendConfirmCancel).toBe("Cancel");
    expect(INV_COPY.quickIssue).toBe("Issue");
    expect(INV_COPY.issueToast).toBe("Invoice issued.");
    expect(INV_COPY.emailSent("ada@x.com")).toBe("Invoice emailed to ada@x.com.");
    expect(INV_COPY.emailNeedsBusinessName).toMatch(/business name/i);
    expect(`${INV_COPY.openInvoice}${INV_COPY.sendInvoice}${INV_COPY.issueToast}`).not.toMatch(
      /Free Beta|free plan|no-cost/i,
    );
  });
});
