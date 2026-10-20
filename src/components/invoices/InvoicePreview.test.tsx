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

  it("shows the Ivano mark top right, an outline status badge and the footer", () => {
    render(<InvoicePreview invoice={invoice({ status: "paid", is_immutable: true, sender: { name: "Ada" } })} profile={profile()} onOpenSettings={() => {}} />);
    expect(screen.getByTestId("ivano-mark")).toHaveAttribute("src", "/brand/ivano-mark-invoice.svg");
    expect(screen.getByTestId("ivano-mark")).toHaveAttribute("height", "20");
    expect(screen.getByTestId("invoice-status").style.background).toBe("transparent");
    expect(screen.getByText("Powered by Kompleet")).toBeInTheDocument();
  });

  it("keeps the seller phone on one line, same nowrap as TIN", () => {
    render(
      <InvoicePreview
        invoice={invoice()}
        profile={profile({
          email: "ada@adafoods.ng",
          phone: "+234 801 234 5678",
          tin: "12345678-0001",
        })}
        onOpenSettings={() => {}}
      />,
    );
    const phone = screen.getByTestId("invoice-party-phone");
    expect(phone).toHaveTextContent("+234 801 234 5678");
    expect(phone.className).toMatch(/whitespace-nowrap/);
    const tin = screen.getByTestId("invoice-party-tin");
    expect(tin).toHaveTextContent("TIN 12345678-0001");
    expect(tin.className).toMatch(/whitespace-nowrap/);
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

