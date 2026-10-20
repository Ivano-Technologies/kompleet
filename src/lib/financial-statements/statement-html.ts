import {
  AMOUNT_NGN_HEADER,
  exportHtmlChrome,
} from "@/lib/export-chrome";

function formatCurrency(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type LineItem = { category: string; amount: number };

export function generateProfitLossHTML(statement: {
  period: { start: string; end: string };
  revenue: { items: LineItem[]; total: number };
  expenses: { items: LineItem[]; total: number };
  netIncome: number;
  taxableIncome: number;
}): string {
  return exportHtmlChrome({
    title: "Profit and loss statement",
    body: `
  <h1>Profit and loss statement</h1>
  <p style="text-align:center;">
    For the period from ${formatDate(statement.period.start)} to ${formatDate(statement.period.end)}
  </p>
  <h2>Revenue</h2>
  <table>
    <tr><th>Description</th><th class="amount">${AMOUNT_NGN_HEADER}</th></tr>
    ${statement.revenue.items
      .map(
        (item) => `
      <tr>
        <td>${item.category}</td>
        <td class="amount">${formatCurrency(item.amount)}</td>
      </tr>`,
      )
      .join("")}
    <tr>
      <td>Total revenue</td>
      <td class="amount">${formatCurrency(statement.revenue.total)}</td>
    </tr>
  </table>
  <h2>Expenses</h2>
  <table>
    <tr><th>Description</th><th class="amount">${AMOUNT_NGN_HEADER}</th></tr>
    ${statement.expenses.items
      .map(
        (item) => `
      <tr>
        <td>${item.category}</td>
        <td class="amount">${formatCurrency(item.amount)}</td>
      </tr>`,
      )
      .join("")}
    <tr>
      <td>Total expenses</td>
      <td class="amount">${formatCurrency(statement.expenses.total)}</td>
    </tr>
  </table>
  <table>
    <tr>
      <td>Net ${statement.netIncome >= 0 ? "profit" : "loss"}</td>
      <td class="amount">${formatCurrency(Math.abs(statement.netIncome))}</td>
    </tr>
    <tr>
      <td>Taxable income</td>
      <td class="amount">${formatCurrency(statement.taxableIncome)}</td>
    </tr>
  </table>`,
  });
}

export function generateBalanceSheetHTML(statement: {
  period: { asOf: string };
  assets: {
    current: { items: LineItem[]; total: number };
    nonCurrent: { items: LineItem[]; total: number };
    total: number;
  };
  liabilities: {
    current: { items: LineItem[]; total: number };
    nonCurrent: { items: LineItem[]; total: number };
  };
  equity: { items: LineItem[]; total: number };
  totalLiabilitiesAndEquity: number;
}): string {
  const section = (title: string, items: LineItem[], totalLabel: string, total: number) => `
  <h3>${title}</h3>
  <table>
    <tr><th>Description</th><th class="amount">${AMOUNT_NGN_HEADER}</th></tr>
    ${items
      .map(
        (item) => `
      <tr>
        <td>${item.category}</td>
        <td class="amount">${formatCurrency(item.amount)}</td>
      </tr>`,
      )
      .join("")}
    <tr>
      <td>${totalLabel}</td>
      <td class="amount">${formatCurrency(total)}</td>
    </tr>
  </table>`;

  return exportHtmlChrome({
    title: "Balance sheet",
    body: `
  <h1>Balance sheet</h1>
  <p style="text-align:center;">As of ${formatDate(statement.period.asOf)}</p>
  <h2>Assets</h2>
  ${section("Current assets", statement.assets.current.items, "Total current assets", statement.assets.current.total)}
  ${section("Non-current assets", statement.assets.nonCurrent.items, "Total non-current assets", statement.assets.nonCurrent.total)}
  <table>
    <tr>
      <td>Total assets</td>
      <td class="amount">${formatCurrency(statement.assets.total)}</td>
    </tr>
  </table>
  <h2>Liabilities and equity</h2>
  ${section("Current liabilities", statement.liabilities.current.items, "Total current liabilities", statement.liabilities.current.total)}
  ${section("Non-current liabilities", statement.liabilities.nonCurrent.items, "Total non-current liabilities", statement.liabilities.nonCurrent.total)}
  ${section("Equity", statement.equity.items, "Total equity", statement.equity.total)}
  <table>
    <tr>
      <td>Total liabilities and equity</td>
      <td class="amount">${formatCurrency(statement.totalLiabilitiesAndEquity)}</td>
    </tr>
  </table>`,
  });
}
