import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvoicePreview } from "./InvoicePreview";
import type { InvoiceView } from "@/lib/invoices/view-types";
import type { BusinessProfile } from "@/lib/invoices/profiles";

vi.mock("@/components/invoices/CustomerCombobox", () => ({
  CustomerCombobox: () => null,
}));

const invoice = (over: Partial<InvoiceView> = {}): InvoiceView => ({
  id: "inv1",
  invoice_number: "INV-2026-0001",
  status: "draft",
  invoice_date: "2026-10-17",
  total_amount: 100000,
  subtotal: 100000,
  vat_amount: 0,
  discount_amount: 0,
  line_items: [{ description: "Catering", quantity: 2, unit_price: 50000, vat_rate: 0, amount: 100000 }],
  customer_info: { name: "Bola Stores" },
  ...over,
});

const profile = (over: Partial<BusinessProfile> = {}): BusinessProfile => ({
  legalName: "Ada Foods Ltd",
  addressLine1: "14 Marina Road",
  addressLine2: "",
  city: "Lagos",
  state: "",
  country: "NG",
  email: "",
  phone: "",
  tin: "",
  vatNumber: "",
  ...over,
});

const LOGO = "https://example.convex.cloud/api/storage/logo";

describe("IVA-185 InvoicePreview sender", () => {
  it("logo plus name shows the business logo with the name beside it", () => {
    render(<InvoicePreview invoice={invoice()} profile={profile({ logoUrl: LOGO, logoWidth: 100, logoHeight: 100 })} onOpenSettings={() => {}} />);
    expect(screen.getByTestId("invoice-sender").dataset.mode).toBe("logo");
    expect(screen.getByAltText("Ada Foods Ltd")).toHaveAttribute("src", LOGO);
    expect(screen.getByText("Ada Foods Ltd")).toBeInTheDocument();
  });

  it("wide logo leaves the name out", () => {
    render(<InvoicePreview invoice={invoice()} profile={profile({ logoUrl: LOGO, logoWidth: 800, logoHeight: 100 })} onOpenSettings={() => {}} />);
    expect(screen.queryByText("Ada Foods Ltd")).toBeNull();
  });

  it("name only shows the name in bold", () => {
    render(<InvoicePreview invoice={invoice()} profile={profile()} onOpenSettings={() => {}} />);
    const sender = screen.getByTestId("invoice-sender");
    expect(sender.dataset.mode).toBe("name");
    expect(sender).toHaveTextContent("Ada Foods Ltd");
    expect(sender.className).toMatch(/font-bold/);
  });

  it("no name shows the placeholder and an Add your logo link, never KOMPLEET", () => {
    const { container } = render(<InvoicePreview invoice={invoice()} profile={profile({ legalName: "" })} onOpenSettings={() => {}} />);
    expect(screen.getByTestId("invoice-sender").dataset.mode).toBe("placeholder");
    expect(screen.getByText("Your business name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add your logo" })).toBeInTheDocument();
    expect(container.querySelector("[data-testid='invoice-document']")?.textContent).not.toMatch(/KOMPLEET/);
  });

  it("issued invoices use the snapshot, not the live profile", () => {
    render(
      <InvoicePreview
        invoice={invoice({ status: "issued", is_immutable: true, sender: { name: "Snapshot Co" } })}
        profile={profile({ legalName: "Renamed Co" })}
        onOpenSettings={() => {}}
      />,
    );
    expect(screen.getByTestId("invoice-sender")).toHaveTextContent("Snapshot Co");
    expect(screen.queryByText("Renamed Co")).toBeNull();
  });

  it("shows Not set in muted grey when a date is missing", () => {
    render(
      <InvoicePreview
        invoice={invoice({ due_date: null })}
        profile={profile()}
        onOpenSettings={() => {}}
      />,
    );
    const empty = screen.getByText("Not set");
    expect(empty.className).toMatch(/font-normal/);
    expect(empty.style.color).toBe("rgb(85, 85, 85)");
  });

  it("shows the Ivano mark top right, an outline status badge and the footer", () => {
    render(<InvoicePreview invoice={invoice({ status: "paid", is_immutable: true, sender: { name: "Ada" } })} profile={profile()} onOpenSettings={() => {}} />);
    expect(screen.getByTestId("ivano-mark")).toHaveAttribute("src", "/brand/ivano-mark-invoice.svg");
    expect(screen.getByTestId("ivano-mark")).toHaveAttribute("height", "20");
    expect(screen.getByTestId("invoice-status").style.background).toBe("transparent");
    expect(screen.getByText("Powered by Kompleet")).toBeInTheDocument();
  });
});

describe("IVA-185 InvoicePreview line amounts", () => {
  it("shows the pre-VAT line amount even when the stored amount includes VAT", () => {
    render(
      <InvoicePreview
        invoice={invoice({
          subtotal: 900000,
          vat_amount: 63750,
          total_amount: 963750,
          line_items: [
            { description: "Catering", quantity: 1, unit_price: 850000, vat_rate: 7.5, amount: 913750 },
            { description: "Delivery", quantity: 2, unit_price: 25000, vat_rate: 0, amount: 50000 },
          ],
        })}
        profile={profile()}
        onOpenSettings={() => {}}
      />,
    );
    const table = screen.getByTestId("invoice-items");
    expect(table).not.toHaveTextContent("913,750.00");
    expect(table.querySelectorAll("tbody tr")[0]).toHaveTextContent(/850,000\.00.*850,000\.00/);
    expect(screen.getByTestId("invoice-total")).toHaveTextContent("963,750.00");
  });
});

describe("IVA-185 InvoicePreview discount column and totals", () => {
  const lines = (discount?: number) =>
    invoice({
      subtotal: 99.99,
      vat_amount: 0,
      total_amount: 99.99,
      discount_amount: discount ?? 0,
      line_items: [
        { description: "Consulting", quantity: 1.5, unit_price: 33.33, vat_rate: 0, amount: 0 },
        { description: "Consulting", quantity: 1.5, unit_price: 33.33, vat_rate: 0, amount: 0, discount },
      ],
    });

  it("hides the Discount column with no discounts and builds the Subtotal from rows", () => {
    render(<InvoicePreview invoice={lines()} profile={profile()} onOpenSettings={() => {}} />);
    const table = screen.getByTestId("invoice-items");
    expect(table.querySelectorAll("thead th")).toHaveLength(4);
    expect(screen.queryByText("Discount")).toBeNull();
    expect(screen.getByText("Subtotal").parentElement).toHaveTextContent("100.00");
    expect(screen.getByTestId("invoice-total")).toHaveTextContent("100.00");
    expect(screen.queryByTestId("invoice-vat-row")).toBeNull();
  });

  it("shows VAT 7.5% when every line uses the same rate", () => {
    render(
      <InvoicePreview
        invoice={invoice({
          line_items: [{ description: "A", quantity: 1, unit_price: 1000, vat_rate: 7.5, amount: 1000 }],
          subtotal: 1000,
          vat_amount: 75,
          total_amount: 1075,
        })}
        profile={profile()}
        onOpenSettings={() => {}}
      />,
    );
    expect(screen.getAllByTestId("invoice-vat-row").map((row) => row.textContent)).toEqual([
      "VAT 7.5%₦75.00",
    ]);
  });

  it("shows one VAT row per rate when rates are mixed", () => {
    render(
      <InvoicePreview
        invoice={invoice({
          line_items: [
            { description: "A", quantity: 1, unit_price: 1000, vat_rate: 7.5, amount: 1000 },
            { description: "B", quantity: 1, unit_price: 200, vat_rate: 5, amount: 200 },
          ],
          subtotal: 1200,
          vat_amount: 85,
          total_amount: 1285,
        })}
        profile={profile()}
        onOpenSettings={() => {}}
      />,
    );
    const rows = screen.getAllByTestId("invoice-vat-row");
    expect(rows.map((row) => row.textContent)).toEqual(["VAT 7.5%₦75.00", "VAT 5%₦10.00"]);
  });

  it("stacks line items below 480 at body size and keeps the table from 480 up", () => {
    const { container } = render(
      <InvoicePreview
        invoice={invoice({
          line_items: [
            { description: "Catering for staff offsite", quantity: 1, unit_price: 850000, vat_rate: 7.5, amount: 850000 },
          ],
        })}
        profile={profile()}
        onOpenSettings={() => {}}
      />,
    );
    const stack = screen.getByTestId("invoice-items-stack");
    expect(stack.className).toMatch(/text-sm/);
    expect(stack.className).toMatch(/max-\[479px\]:block/);
    expect(stack.className).toMatch(/min-\[480px\]:hidden/);
    expect(stack).toHaveTextContent("Catering for staff offsite");
    expect(stack).toHaveTextContent("1 × ₦850,000.00");
    expect(stack.textContent).not.toMatch(/7\.5%/);
    expect(stack.querySelector("span.font-bold")).toHaveTextContent("₦850,000.00");
    const table = screen.getByTestId("invoice-items");
    expect(table.className).toMatch(/table-fixed/);
    expect(table.className).toMatch(/text-sm/);
    expect(table.className).not.toMatch(/text-\[10px\]/);
    expect(table.parentElement?.className).toMatch(/max-\[479px\]:hidden/);
    expect(table.querySelector("thead")).toHaveTextContent("Amount");
    const doc = container.querySelector("[data-testid='invoice-document']");
    expect(doc?.getAttribute("style")).toMatch(/background:\s*rgb\(255,\s*255,\s*255\)/);
    expect(doc?.getAttribute("style")).toMatch(/color:\s*rgb\(0,\s*0,\s*0\)/);
    expect(stack.innerHTML).not.toMatch(/bg-(?:primary|emerald|green|red|blue|amber)/);
  });

  it("puts the VAT rate on the stacked meta line only when rates are mixed", () => {
    render(
      <InvoicePreview
        invoice={invoice({
          line_items: [
            { description: "Catering for staff offsite", quantity: 1, unit_price: 850000, vat_rate: 7.5, amount: 850000 },
            { description: "Staff meals", quantity: 2, unit_price: 40000, vat_rate: 5, amount: 80000 },
          ],
        })}
        profile={profile()}
        onOpenSettings={() => {}}
      />,
    );
    const stack = screen.getByTestId("invoice-items-stack");
    expect(stack).toHaveTextContent("1 × ₦850,000.00 · 7.5%");
    expect(stack).toHaveTextContent("2 × ₦40,000.00 · 5%");
  });

  it("shows the Discount column when a line has a discount, and no Discount totals row", () => {
    render(<InvoicePreview invoice={lines(9.99)} profile={profile()} onOpenSettings={() => {}} />);
    const table = screen.getByTestId("invoice-items");
    expect(table.querySelectorAll("thead th")).toHaveLength(5);
    expect(screen.getAllByText("Discount")).toHaveLength(1);
    expect(table.querySelectorAll("tbody tr")[1]).toHaveTextContent("9.99");
    expect(table.querySelectorAll("tbody tr")[1]).toHaveTextContent("40.01");
    expect(screen.getByTestId("invoice-total")).toHaveTextContent("90.01");
  });
});

