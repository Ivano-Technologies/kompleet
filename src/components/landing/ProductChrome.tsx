type ProductChromeVariant = "dashboard" | "import" | "invoice" | "tax";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", active: true },
  { label: "Transactions", active: false },
  { label: "Invoices", active: false },
  { label: "Reports", active: false },
] as const;

function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-text-3">
      Demo
    </span>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-[132px] shrink-0 flex-col bg-gradient-to-b from-primary-deep to-primary p-3">
      <div className="mb-4 px-1 font-ceoruse text-[11px] font-bold tracking-wider text-white">
        KOMPLEET
      </div>
      <nav className="space-y-1">
        {SIDEBAR_ITEMS.map((item) => (
          <div
            key={item.label}
            className={
              item.active
                ? "rounded-md border border-accent/25 bg-accent/15 px-2 py-1.5 text-[11px] font-semibold text-accent"
                : "rounded-md px-2 py-1.5 text-[11px] text-white/55"
            }
          >
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function DashboardBody() {
  return (
    <div className="flex-1 space-y-3 bg-bg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-text-1">
            Dashboard
          </p>
          <p className="text-[11px] text-text-3">Financial overview</p>
        </div>
        <DemoBadge />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Revenue", value: "₦••••" },
          { label: "Invoices", value: "₦••••" },
          { label: "Tax due", value: "₦••••" },
          { label: "Net", value: "₦••••" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-border bg-surface p-3"
          >
            <p className="text-[10px] text-text-3">{kpi.label}</p>
            <p className="mt-1 text-sm font-semibold text-text-1">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="flex h-20 items-end gap-1.5 rounded-lg border border-border bg-surface px-3 pb-3 pt-4">
        {[40, 64, 48, 72, 56, 80, 60, 76].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ImportBody() {
  return (
    <div className="flex-1 space-y-3 bg-bg p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-text-1">
          Import
        </p>
        <DemoBadge />
      </div>
      <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
        {["GTBank statement", "Access Bank", "Zenith Bank"].map((row, i) => (
          <div
            key={row}
            className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2"
          >
            <span className="text-[11px] text-text-2">{row}</span>
            <span className="text-[11px] text-text-3">
              {i === 0 ? "Validated" : "Ready"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceBody() {
  return (
    <div className="flex-1 space-y-3 bg-bg p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-text-1">
          Invoice
        </p>
        <DemoBadge />
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 h-8 rounded-md bg-primary" />
        <div className="space-y-2">
          <div className="h-2 w-2/3 rounded bg-surface-2" />
          <div className="h-2 w-full rounded bg-surface-2" />
          <div className="h-2 w-5/6 rounded bg-surface-2" />
        </div>
        <p className="mt-4 text-xs text-text-2">₦••••</p>
      </div>
    </div>
  );
}

function TaxBody() {
  return (
    <div className="flex-1 space-y-3 bg-bg p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-text-1">
          Tax centre
        </p>
        <DemoBadge />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["VAT", "CIT", "PIT"].map((tax) => (
          <div
            key={tax}
            className="rounded-lg border border-border bg-surface p-3 text-center"
          >
            <p className="text-[10px] text-text-3">{tax}</p>
            <p className="mt-1 text-xs font-semibold text-text-1">₦••••</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="text-[11px] text-text-2">NRS / LIRS package</p>
        <p className="mt-1 text-[11px] text-text-3">Ready to download</p>
      </div>
    </div>
  );
}

export default function ProductChrome({
  variant = "dashboard",
  className = "",
}: {
  variant?: ProductChromeVariant;
  className?: string;
}) {
  const body =
    variant === "import" ? (
      <ImportBody />
    ) : variant === "invoice" ? (
      <InvoiceBody />
    ) : variant === "tax" ? (
      <TaxBody />
    ) : (
      <DashboardBody />
    );

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-surface shadow-1 ${className}`}
      aria-label={`Kompleet ${variant} preview (demo data)`}
    >
      <div className="flex min-h-[240px] md:min-h-[320px]">
        <Sidebar />
        {body}
      </div>
    </div>
  );
}
