/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthedConvex = vi.fn();
const sendEmail = vi.fn();
const generateInvoicePDF = vi.fn();

vi.mock("@/lib/convex/server", () => ({
  requireAuthedConvex: (...args: unknown[]) => requireAuthedConvex(...args),
  isUnauthorized: () => false,
}));

vi.mock("@/lib/convex/http", () => ({
  api: { invoices: { getMine: "invoices.getMine" } },
}));

vi.mock("@/lib/with-audit", () => ({
  withAudit: (handler: unknown) => handler,
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: (handler: unknown) => handler,
}));

vi.mock("@/lib/email-service", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

vi.mock("@/lib/invoice-service", () => ({
  generateInvoicePDF: (...args: unknown[]) => generateInvoicePDF(...args),
}));

import { POST } from "./route";

const issued = {
  id: "inv-fixture-1",
  invoice_number: "INV-001",
  status: "issued",
  total_amount: 80_625,
  customer_info: { name: "Fixture Client Ltd", email: "ada@x.com" },
  sender: { name: "Test Traders Ltd" },
};

describe("POST /api/invoices/[id]/send", () => {
  beforeEach(() => {
    requireAuthedConvex.mockReset();
    sendEmail.mockReset();
    generateInvoicePDF.mockReset();
    delete process.env.RESEND_API_KEY;
    delete process.env.AUTH_RESEND_KEY;
  });

  it("attaches a generated PDF and names the business in the email", async () => {
    const pdf = Buffer.from("%PDF-fixture");
    generateInvoicePDF.mockResolvedValue(pdf);
    sendEmail.mockResolvedValue(true);
    requireAuthedConvex.mockResolvedValue({
      convex: { query: vi.fn().mockResolvedValue(issued) },
    });
    const res = await POST(
      new Request("http://localhost/api/invoices/inv-fixture-1/send", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ id: "inv-fixture-1" }) },
    );
    const body = (await res.json()) as {
      sent: boolean;
      to?: string;
      attachedPdf?: boolean;
    };
    expect(res.status).toBe(200);
    expect(body).toEqual({ sent: true, to: "ada@x.com", attachedPdf: true });
    expect(sendEmail).toHaveBeenCalledOnce();
    const [to, template, attachments] = sendEmail.mock.calls[0] as [
      string,
      { text: string; subject: string },
      Array<{ filename: string; content: string }>,
    ];
    expect(to).toBe("ada@x.com");
    expect(template.subject).toBe("Invoice INV-001 from Test Traders Ltd");
    expect(template.text).toContain("The invoice PDF is attached.");
    expect(template.text).not.toMatch(/your supplier|Kompleet/i);
    expect(attachments[0]?.filename).toBe("INV-001.pdf");
    expect(attachments[0]?.content).toBe(pdf.toString("base64"));
  });

  it("still sends the honest body when PDF generation fails", async () => {
    generateInvoicePDF.mockRejectedValue(new Error("pdf failed"));
    sendEmail.mockResolvedValue(true);
    requireAuthedConvex.mockResolvedValue({
      convex: { query: vi.fn().mockResolvedValue(issued) },
    });
    const res = await POST(
      new Request("http://localhost/api/invoices/inv-fixture-1/send", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ id: "inv-fixture-1" }) },
    );
    const body = (await res.json()) as { sent: boolean; attachedPdf?: boolean };
    expect(body.sent).toBe(true);
    expect(body.attachedPdf).toBe(false);
    const template = sendEmail.mock.calls[0][1] as { text: string };
    expect(template.text).toBe(
      "Invoice INV-001 for ₦80,625.00 from Test Traders Ltd is ready. Reply to this email if you have questions.",
    );
    expect(sendEmail.mock.calls[0][2]).toBeUndefined();
  });

  it("blocks send when the invoice has no business name", async () => {
    requireAuthedConvex.mockResolvedValue({
      convex: {
        query: vi.fn().mockResolvedValue({ ...issued, sender: { name: "" } }),
      },
    });
    const res = await POST(
      new Request("http://localhost/api/invoices/inv-fixture-1/send", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ id: "inv-fixture-1" }) },
    );
    const body = (await res.json()) as { error?: string };
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/business name/i);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(generateInvoicePDF).not.toHaveBeenCalled();
  });

  it("does not claim a send when the mail key is unset", async () => {
    generateInvoicePDF.mockResolvedValue(Buffer.from("%PDF-fixture"));
    sendEmail.mockResolvedValue(false);
    requireAuthedConvex.mockResolvedValue({
      convex: { query: vi.fn().mockResolvedValue(issued) },
    });
    const res = await POST(
      new Request("http://localhost/api/invoices/inv-fixture-1/send", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ id: "inv-fixture-1" }) },
    );
    const body = (await res.json()) as { sent: boolean; error?: string };
    expect(body.sent).toBe(false);
    expect(body.error).toMatch(/couldn't send the invoice email/i);
  });

  it("rejects drafts instead of sending", async () => {
    requireAuthedConvex.mockResolvedValue({
      convex: {
        query: vi.fn().mockResolvedValue({ ...issued, status: "draft" }),
      },
    });
    const res = await POST(
      new Request("http://localhost/api/invoices/inv-fixture-1/send", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ id: "inv-fixture-1" }) },
    );
    expect(res.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
