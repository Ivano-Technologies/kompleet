import Link from "next/link";

const summaryItems = [
  { label: "Total Inflow", value: "₦3,240,000", change: "+12%" },
  { label: "Total Outflow", value: "₦1,890,500", change: "-4%" },
  { label: "Net Flow", value: "₦1,349,500", change: "+18%" },
  { label: "Uncategorized", value: "24", change: "Review" },
];

const mockTransactions = [
  {
    id: "1",
    date: "27 Feb 2026",
    description: "Payment from Acme Ltd",
    category: "Revenue",
    amount: "+₦450,000",
    type: "credit" as const,
  },
  {
    id: "2",
    date: "26 Feb 2026",
    description: "GTBank - Office Rent",
    category: "Rent",
    amount: "-₦280,000",
    type: "debit" as const,
  },
  {
    id: "3",
    date: "25 Feb 2026",
    description: "Paystack - Customer payment",
    category: "Revenue",
    amount: "+₦125,000",
    type: "credit" as const,
  },
  {
    id: "4",
    date: "24 Feb 2026",
    description: "Lagos Water Corporation",
    category: "Utilities",
    amount: "-₦15,200",
    type: "debit" as const,
  },
  {
    id: "5",
    date: "23 Feb 2026",
    description: "Transfer - Vendor payment",
    category: "Supplies",
    amount: "-₦89,500",
    type: "debit" as const,
  },
];

export default function AppTransactionsPage() {
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">
            Transactions
          </h1>
          <p className="text-sm text-text-3 dark:text-dark-text-3 mt-1">
            View and manage all your business transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Search transactions..."
            className="bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md px-4 py-2.5 text-sm w-48 md:w-64"
          />
          <Link
            href="/transactions/upload"
            className="bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-primary-deep transition-colors"
          >
            Upload
          </Link>
          <Link
            href="/transactions"
            className="bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border text-text-2 dark:text-dark-text-2 text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
          >
            Full view
          </Link>
        </div>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg p-4 shadow-1"
          >
            <div className="text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider">
              {item.label}
            </div>
            <div className="font-display text-xl font-bold text-text-1 dark:text-dark-text-1 mt-1">
              {item.value}
            </div>
            <div className="text-xs text-text-3 dark:text-dark-text-3 mt-0.5">
              {item.change}
            </div>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg shadow-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-dark-border bg-surface-2 dark:bg-dark-surface-2">
                <th className="text-left text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider px-6 py-4">
                  Date
                </th>
                <th className="text-left text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider px-6 py-4">
                  Description
                </th>
                <th className="text-left text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider px-6 py-4">
                  Category
                </th>
                <th className="text-right text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider px-6 py-4">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border dark:border-dark-border last:border-b-0 hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
                >
                  <td className="px-6 py-4 text-text-2 dark:text-dark-text-2">
                    {tx.date}
                  </td>
                  <td className="px-6 py-4 font-medium text-text-1 dark:text-dark-text-1">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4 text-text-3 dark:text-dark-text-3">
                    {tx.category}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-semibold ${
                      tx.type === "credit"
                        ? "text-success dark:text-success-dark"
                        : "text-text-1 dark:text-dark-text-1"
                    }`}
                  >
                    {tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border dark:border-dark-border text-xs text-text-4 dark:text-dark-text-4">
          Showing 5 of 247 transactions ·{" "}
          <Link
            href="/transactions"
            className="font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </div>
    </div>
  );
}
