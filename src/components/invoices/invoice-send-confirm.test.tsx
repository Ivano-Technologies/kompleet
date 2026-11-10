/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { INV_COPY } from "./invoice-copy";

describe("invoice send / issue confirmation copy", () => {
  it("has distinct Open vs Send/Issue labels and a sent-email confirmation", () => {
    expect(INV_COPY.openInvoice).toBe("Open");
    expect(INV_COPY.sendInvoice).toBe("Send");
    expect(INV_COPY.quickIssue).toBe("Issue");
    expect(INV_COPY.issueToast).toBe("Invoice issued.");
    expect(INV_COPY.emailSent("billing@fixture.test")).toBe(
      "Invoice emailed to billing@fixture.test.",
    );
    expect(`${INV_COPY.openInvoice}${INV_COPY.sendInvoice}${INV_COPY.issueToast}`).not.toMatch(
      /Free Beta|free plan|no-cost/i,
    );
  });
});
