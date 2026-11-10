/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InvoiceDetailPage from "./page";

const sendInvoiceEmail = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: "inv-fixture-1" }),
}));

vi.mock("@/components/documents/AttachFileButton", () => ({
  AttachFileButton: () => null,
}));

vi.mock("@/components/invoices/InvoicePreview", () => ({
  InvoicePreview: () => <div>Invoice preview fixture</div>,
}));

vi.mock("@/components/invoices/invoice-actions", () => ({
  attachInvoiceClient: vi.fn(),
  cancelInvoice: vi.fn(),
  issueInvoice: vi.fn(),
  markInvoicePaid: vi.fn(),
  sendInvoiceEmail: (...args: unknown[]) => sendInvoiceEmail(...args),
}));

vi.mock("@/lib/invoices/profile-events", () => ({
  onBusinessProfileChanged: () => () => undefined,
}));

vi.mock("@/components/ui/error-toast", () => ({
  notifyError: vi.fn(),
}));

function mockInvoiceFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === "/api/invoices/inv-fixture-1") {
        return {
          ok: true,
          json: async () => ({
            invoice: {
              id: "inv-fixture-1",
              invoice_number: "INV-001",
              status: "issued",
              tax_year: 2026,
              invoice_date: "2026-11-10",
              total_amount: 80_625,
              subtotal: 75_000,
              vat_amount: 5_625,
              discount_amount: 0,
              line_items: [],
              customer_info: {
                name: "Fixture Client Ltd",
                email: "ada@x.com",
              },
              sender: { name: "Test Traders Ltd" },
            },
          }),
        };
      }
      if (url === "/api/business-profile") {
        return {
          ok: true,
          json: async () => ({ profile: { legalName: "Test Traders Ltd" } }),
        };
      }
      if (url === "/api/clients") {
        return { ok: true, json: async () => ({ clients: [] }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    }),
  );
}

describe("issued invoice send confirm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sendInvoiceEmail.mockReset();
  });

  it("asks to confirm the recipient, then shows the sent notice", async () => {
    mockInvoiceFetch();
    sendInvoiceEmail.mockResolvedValue({ sent: true, to: "ada@x.com" });
    const user = userEvent.setup();
    render(<InvoiceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("INV-001")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Send" }));
    const dialog = screen.getByRole("dialog", {
      name: "Send INV-001 to ada@x.com?",
    });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(sendInvoiceEmail).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Send" }));
    await waitFor(() => {
      expect(sendInvoiceEmail).toHaveBeenCalledWith("inv-fixture-1");
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Invoice emailed to ada@x.com.",
    );
  });
});
