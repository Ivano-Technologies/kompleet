/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NewInvoicePage from "./page";
import { DISCOUNT_TOO_BIG, totalsFromLines } from "@/lib/invoices/line-amounts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/invoices/CustomerCombobox", () => ({ CustomerCombobox: () => null }));

type Line = { quantity: number; unit_price: number; vat_rate: number; discount?: number };

const naira = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

/** Each line item has four number inputs: Qty, Unit Price, VAT %, Discount. */
function fillLines(lines: Line[]) {
  for (let i = 1; i < lines.length; i++) fireEvent.click(screen.getByText("Add Line Item"));
  const inputs = screen.getAllByRole("spinbutton");
  expect(inputs).toHaveLength(lines.length * 4);
  lines.forEach((line, i) => {
    const [qty, price, vat, discount] = inputs.slice(i * 4, i * 4 + 4);
    fireEvent.change(qty, { target: { value: String(line.quantity) } });
    fireEvent.change(price, { target: { value: String(line.unit_price) } });
    fireEvent.change(vat, { target: { value: String(line.vat_rate) } });
    fireEvent.change(discount, { target: { value: String(line.discount ?? 0) } });
  });
}

describe("IVA-185 /invoices/new summary matches the invoice totals", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ clients: [], profile: null }) })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows one VAT row per non-zero rate, no Discount row, and adds up to the Total", async () => {
    const lines: Line[] = [
      { quantity: 1, unit_price: 1000, vat_rate: 7.5, discount: 100 },
      { quantity: 1, unit_price: 333.33, vat_rate: 5 },
      { quantity: 2, unit_price: 100, vat_rate: 0 },
    ];
    render(<NewInvoicePage />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fillLines(lines);

    const invoice = totalsFromLines(lines);
    expect(invoice).toMatchObject({ subtotal: 1433.33, vat_amount: 84.17, total_amount: 1517.5 });

    expect(screen.getByTestId("form-subtotal")).toHaveTextContent(naira(invoice.subtotal));
    const vatRows = screen.getAllByTestId("form-vat-row");
    expect(vatRows.map((row) => row.textContent)).toEqual([
      `VAT (7.5%)${naira(67.5)}`,
      `VAT (5%)${naira(16.67)}`, // 16.6665 half-up
    ]);
    expect(screen.getByTestId("form-total")).toHaveTextContent(naira(invoice.total_amount));
    // The summary reads Subtotal + VAT rows = Total, the same as the invoice.
    expect(Number((invoice.subtotal + 67.5 + 16.67).toFixed(2))).toBe(invoice.total_amount);
    expect(screen.queryByText(/^Discount \(₦\)$/)).toBeNull();
    expect(screen.queryByText("VAT (0%)")).toBeNull();
  });

  it("accepts a discount equal to the shown line total and refuses one kobo more", async () => {
    render(<NewInvoicePage />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fillLines([{ quantity: 1.5, unit_price: 33.33, vat_rate: 7.5, discount: 50 }]);
    expect(screen.queryByText(DISCOUNT_TOO_BIG)).toBeNull();
    expect(screen.getByTestId("form-total")).toHaveTextContent(naira(0));

    fireEvent.change(screen.getAllByRole("spinbutton")[3], { target: { value: "50.01" } });
    expect(screen.getByRole("alert")).toHaveTextContent(DISCOUNT_TOO_BIG);
  });
});
