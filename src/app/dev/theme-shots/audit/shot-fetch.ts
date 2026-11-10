const FIXTURE_INVOICE = {
  id: "inv-fixture-1",
  invoice_number: "INV-001",
  title: "Catering — Fixture Client Ltd",
  status: "issued",
  tax_year: 2026,
  invoice_date: "2026-11-10",
  due_date: "2026-11-24",
  total_amount: 80_625,
  subtotal: 75_000,
  vat_amount: 5_625,
  discount_amount: 0,
  client_id: "cli-fixture-1",
  line_items: [
    {
      description: "Catering for staff away-day",
      quantity: 1,
      unit_price: 75_000,
      vat_rate: 7.5,
      amount: 75_000,
    },
  ],
  customer_info: {
    name: "Fixture Client Ltd",
    email: "ada@fixture.test",
    city: "Lagos",
  },
  sender: {
    name: "Test Traders Ltd",
    addressLine1: "12 Fixture Close",
    city: "Lagos",
    country: "NG",
  },
};

const TRANSACTIONS = [
  {
    id: "txn-1",
    transaction_date: "2026-11-08",
    description: "GTBank transfer — Ada Ventures",
    amount: 450_000,
    transaction_type: "credit" as const,
    category: { id: "cat-sales", name: "Sales", category_type: "income" },
    is_reconciled: true,
  },
  {
    id: "txn-2",
    transaction_date: "2026-11-07",
    description: "MTN airtime bulk",
    amount: 24_500,
    transaction_type: "debit" as const,
    is_reconciled: false,
  },
  {
    id: "txn-3",
    transaction_date: "2026-11-06",
    description: "Invoice 1042 — Kano Supplies",
    amount: 1_250_000,
    transaction_type: "credit" as const,
    category: { id: "cat-sales", name: "Sales", category_type: "income" },
    is_reconciled: true,
  },
  {
    id: "txn-4",
    transaction_date: "2026-11-05",
    description: "Office rent — Ikeja",
    amount: 350_000,
    transaction_type: "debit" as const,
    is_reconciled: false,
  },
  {
    id: "txn-5",
    transaction_date: "2026-11-04",
    description: "Paystack settlement",
    amount: 88_400,
    transaction_type: "credit" as const,
    is_reconciled: true,
  },
  {
    id: "txn-6",
    transaction_date: "2026-11-03",
    description: "Generator diesel — last row",
    amount: 62_000,
    transaction_type: "debit" as const,
    is_reconciled: false,
  },
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function installAuditShotFetch(options?: { emptyExport?: boolean }): void {
  if (typeof window === "undefined") return;
  const marker = window as Window & { __auditShotFetch?: boolean };
  if (marker.__auditShotFetch) return;
  marker.__auditShotFetch = true;

  const emptyExport = Boolean(options?.emptyExport);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.startsWith("/api/transactions?") && method === "GET") {
      return json({
        transactions: TRANSACTIONS,
        pagination: {
          limit: 50,
          total: TRANSACTIONS.length,
          nextCursor: null,
          isDone: true,
        },
      });
    }
    if (url === "/api/categories") {
      return json({
        categories: [
          { id: "cat-sales", name: "Sales Revenue", category_type: "income", tax_treatment: "taxable", keywords: [], is_system: true },
          { id: "cat-rent", name: "Rent", category_type: "expense", tax_treatment: "deductible", keywords: [], is_system: true },
        ],
      });
    }
    if (url.startsWith("/api/invoices?") && method === "GET") {
      return json({ invoices: [FIXTURE_INVOICE] });
    }
    if (url === "/api/invoices/inv-fixture-1" && method === "GET") {
      return json({ invoice: FIXTURE_INVOICE });
    }
    if (url === "/api/business-profile") {
      return json({
        profile: {
          legalName: "Test Traders Ltd",
          addressLine1: "12 Fixture Close",
          addressLine2: "",
          city: "Lagos",
          state: "Lagos",
          country: "NG",
          email: "billing@fixture.test",
          phone: "",
          tin: "",
          vatNumber: "",
        },
      });
    }
    if (url === "/api/clients" && method === "GET") {
      return json({ clients: [] });
    }
    if (url === "/api/clients" && method === "POST") {
      return json({
        client: {
          id: "cli-new-1",
          legal_name: "Fixture New Client Ltd",
          email: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          country: "NG",
        },
      });
    }
    if (url === "/api/export/history") {
      if (emptyExport) return json({ history: [] });
      const created = new Date("2026-11-10T10:00:00.000Z");
      const expires = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
      return json({
        history: [
          {
            id: "exp-1",
            export_type: "transactions",
            format: "csv",
            tax_year: 2026,
            file_size: 12_480,
            created_at: created.toISOString(),
            expires_at: expires.toISOString(),
          },
        ],
      });
    }
    if (url === "/api/auth/ensure-profile" && method === "POST") {
      return json({
        profile: {
          id: "audit-shot-user",
          email: "chukwuemeka@fixture.test",
          full_name: "Chukwuemeka Okonkwo-Adebayo",
          company_name: "Test Traders Ltd",
        },
      });
    }
    if (url === "/api/notifications/preferences") {
      return json({ preferences: { emailEnabled: true } });
    }
    if (url === "/api/year/available") {
      return json({ years: [2026, 2025] });
    }
    return json({ error: "unmocked" }, 404);
  };
}

export { FIXTURE_INVOICE, TRANSACTIONS };
