/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthedConvex = vi.fn();
const sendEmail = vi.fn();

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

import { POST } from "./route";

const issued = {
  id: "inv-fixture-1",
  invoice_number: "INV-2026-0001",
  status: "issued",
  total_amount: 80_625,
  customer_info: { name: "Fixture Client Ltd", email: "billing@fixture.test" },
  sender: { name: "Test Traders Ltd" },
};

describe("POST /api/invoices/[id]/send", () => {
  beforeEach(() => {
    requireAuthedConvex.mockReset();
    sendEmail.mockReset();
    delete process.env.RESEND_API_KEY;
    delete process.env.AUTH_RESEND_KEY;
  });

  it("returns sent:true and the recipient when email actually goes out", async () => {
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
    const body = (await res.json()) as { sent: boolean; to?: string };
    expect(res.status).toBe(200);
    expect(body).toEqual({ sent: true, to: "billing@fixture.test" });
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("does not claim a send when the mail key is unset", async () => {
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
