/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewInvoiceSheet } from "@/components/invoices/NewInvoiceSheet";
import { GenerateFromBooksCard } from "@/components/tax/GenerateFromBooksCard";
import { FilingGenerateSheet } from "@/components/tax/FilingGenerateSheet";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
  useQuery: () => undefined,
}));

describe("Wave 3 money-path UI", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ clients: [] }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the invoice sheet with A/B/C and Issue as the primary quick-create CTA", async () => {
    render(<NewInvoiceSheet open onClose={() => undefined} />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: "New invoice" })).toBeTruthy();
    expect(screen.getByText("A · Drop")).toBeTruthy();
    expect(screen.getByText("B · Quick create")).toBeTruthy();
    expect(screen.getByText("Need line items / discounts? Full form")).toBeTruthy();

    const issue = screen.getByRole("button", { name: "Issue" });
    const draft = screen.getByRole("button", { name: "Save draft" });
    expect(issue.className).toContain("btn-primary");
    expect(draft.className).toContain("btn-secondary");
  });

  it("keeps Generate enabled when books exist and uncategorized is only a warning", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        income: 4_820_000,
        expenses: 2_140_500,
        turnover: 4_820_000,
        count: 12,
        uncategorized: 3,
      }),
    } as Response);

    render(<GenerateFromBooksCard />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Generate report" })).toBeTruthy();
    });
    expect(
      screen.getByText("3 uncategorized, so totals may be incomplete"),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Advanced · override figures" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Generate report" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("hides Generate as primary when there are no books", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        income: 0,
        expenses: 0,
        turnover: 0,
        count: 0,
        uncategorized: 0,
      }),
    } as Response);

    render(<GenerateFromBooksCard />);

    await waitFor(() => {
      expect(screen.getByText("Drop a statement first")).toBeTruthy();
    });
    expect(screen.queryByRole("button", { name: "Generate report" })).toBeNull();
    expect(screen.getByRole("link", { name: "Import" })).toBeTruthy();
  });

  it("renders a real Filing Generate PDF sheet", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        income: 100,
        expenses: 40,
        turnover: 100,
        count: 2,
        uncategorized: 1,
      }),
    } as Response);

    render(
      <FilingGenerateSheet
        open
        onClose={() => undefined}
        onGenerated={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Generate filing package" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generate PDF" })).toBeTruthy();
    await waitFor(() => {
      expect(
        screen.getByText("1 uncategorized, so totals may be incomplete"),
      ).toBeTruthy();
    });
    await userEvent.click(screen.getByRole("button", { name: "Generate PDF" }));
    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([url]) => url === "/api/forms/generate")).toBe(
        true,
      );
    });
  });

  it("creates or selects the client from the quick-create Customer field on Save draft", async () => {
    const created = {
      id: "cli-fixture-1",
      legal_name: "Audit Customer One",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "NG",
    };
    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url === "/api/clients" && method === "POST") {
        return {
          ok: true,
          json: async () => ({ client: created }),
        } as Response;
      }
      if (url.startsWith("/api/clients")) {
        return { ok: true, json: async () => ({ clients: [] }) } as Response;
      }
      if (url.startsWith("/api/business-profile")) {
        return {
          ok: true,
          json: async () => ({ profile: { legalName: "Test Traders Ltd" } }),
        } as Response;
      }
      if (url === "/api/invoices/create") {
        const body = JSON.parse(String(init?.body)) as { client_id?: string };
        expect(body.client_id).toBe("cli-fixture-1");
        return {
          ok: true,
          json: async () => ({ invoice_id: "inv-fixture-1" }),
        } as Response;
      }
      throw new Error(`unexpected fetch ${method} ${url}`);
    });

    const user = userEvent.setup();
    render(<NewInvoiceSheet open onClose={() => undefined} />);
    const customer = await screen.findByLabelText(/Customer/i);
    await user.type(customer, "Audit Customer One");
    await user.type(screen.getByRole("spinbutton"), "75000");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      const createClient = vi
        .mocked(fetch)
        .mock.calls.find(
          ([url, init]) =>
            String(url) === "/api/clients" &&
            (init as RequestInit | undefined)?.method === "POST",
        );
      expect(createClient).toBeTruthy();
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(([url]) => String(url) === "/api/invoices/create"),
      ).toBe(true);
    });
  });
});
