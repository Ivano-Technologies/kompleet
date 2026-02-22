import Link from "next/link";
import {
  Calculator,
  Building2,
  User,
  BarChart3,
  FileText,
  Factory,
  Home,
} from "lucide-react";

export default function TaxCenterPage() {
  const calculators = [
    {
      id: "business-tax",
      title: "Business Tax (CIT)",
      description:
        "Company Income Tax, Development Levy, and business taxes per NTA 2026.",
      href: "/calculators/business-tax",
      Icon: Building2,
      phase: 1,
      features: [
        "CIT (0%, 30% rates)",
        "Development Levy (4%)",
        "Tertiary Education Tax (2.5%)",
        "Tax relief calculations",
      ],
      tags: ["CIT", "Business"],
    },
    {
      id: "individual-tax",
      title: "Individual Tax (PIT)",
      description:
        "Personal Income Tax with progressive bands and Nigerian reliefs.",
      href: "/calculators/individual-tax",
      Icon: User,
      phase: 1,
      features: [
        "Progressive bands (7–21%)",
        "Personal relief (₦200k + 1%)",
        "Rent relief (₦500k max)",
        "Pension relief",
      ],
      tags: ["PIT", "Personal"],
    },
    {
      id: "vat",
      title: "VAT Compliance",
      description: "Check VAT obligations and calculate at 7.5%.",
      href: "/calculators/vat",
      Icon: BarChart3,
      phase: 1,
      features: [
        "Turnover threshold (₦100M)",
        "Asset threshold (₦250M)",
        "VAT at 7.5%",
        "Exemption check",
      ],
      tags: ["VAT", "Compliance"],
    },
    {
      id: "stamp-duty",
      title: "Stamp Duty",
      description: "Stamp duty on contracts, receipts, and legal instruments.",
      href: "/calculators/stamp-duty",
      Icon: FileText,
      phase: 2,
      features: [
        "Contract stamp duty",
        "Receipt stamp duty",
        "Legal instrument duties",
      ],
      tags: ["Stamp Duty"],
    },
    {
      id: "capital-allowances",
      title: "Capital Allowances",
      description: "Track capital allowances and asset depreciation.",
      href: "/calculators/capital-allowances",
      Icon: Factory,
      phase: 2,
      features: [
        "Asset depreciation",
        "Initial allowance",
        "Annual allowance tracking",
      ],
      tags: ["Depreciation"],
    },
    {
      id: "property-tax",
      title: "Property Tax",
      description: "Property taxes, land use charges, and tenement rates.",
      href: "/calculators/property-tax",
      Icon: Home,
      phase: 2,
      features: [
        "Land use charge",
        "Tenement rate",
        "Property value assessment",
      ],
      tags: ["Property"],
    },
  ];

  const phase1 = calculators.filter((c) => c.phase === 1);
  const phase2 = calculators.filter((c) => c.phase === 2);

  const CalcCard = ({
    calc,
    muted,
  }: {
    calc: (typeof calculators)[0];
    muted?: boolean;
  }) => {
    const { Icon } = calc;
    return (
      <Link href={calc.href} className="group block">
        <div
          className={`h-full p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:border-primary-500 transition-all ${muted ? "opacity-80 hover:opacity-100" : ""}`}
        >
          <div className="flex items-start gap-3 mb-3">
            <div
              className={`p-2 rounded-lg ${muted ? "bg-light-background dark:bg-dark-background dark:bg-dark-surface" : "bg-primary-50 dark:bg-primary-900/20"}`}
            >
              <Icon
                className={`w-5 h-5 ${muted ? "text-light-text-tertiary dark:text-dark-text-tertiary" : "text-primary-500"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary group-hover:text-primary-500 transition-colors">
                {calc.title}
              </h3>
              <div className="flex gap-1.5 mt-1">
                {calc.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-light-background dark:bg-dark-background text-light-text-tertiary dark:text-dark-text-tertiary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3 leading-relaxed">
            {calc.description}
          </p>
          <ul className="space-y-1">
            {calc.features.map((f, i) => (
              <li
                key={i}
                className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary flex items-start gap-1.5"
              >
                <span
                  className={
                    muted
                      ? "text-light-text-tertiary dark:text-dark-text-tertiary"
                      : "text-primary-500"
                  }
                >
                  ✓
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-medium text-primary-500 group-hover:underline">
            Open Calculator →
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-primary-500" />
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Tax Center
          </h1>
        </div>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Professional tax calculators compliant with Nigerian Tax Act 2026 and
          FIRS regulations.
        </p>
      </div>

      {/* Phase 1 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary">
            Essential Calculators
          </h2>
          <span className="text-[10px] bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium">
            Phase 1
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {phase1.map((c) => (
            <CalcCard key={c.id} calc={c} />
          ))}
        </div>
      </div>

      {/* Phase 2 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary">
            Additional Calculators
          </h2>
          <span className="text-[10px] bg-light-text-tertiary/20 dark:bg-dark-text-tertiary/20 text-light-text-secondary dark:text-dark-text-secondary px-2 py-0.5 rounded-full font-medium">
            Phase 2
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {phase2.map((c) => (
            <CalcCard key={c.id} calc={c} muted />
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
          Need Help?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              How It Works
            </h4>
            <ol className="space-y-1 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              {[
                "Select a calculator",
                "Enter financial information",
                "Review calculated obligations",
                "Export as PDF or save",
                "Use breakdown to file taxes",
              ].map((s, i) => (
                <li key={i}>
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h4 className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Accuracy
            </h4>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary leading-relaxed">
              All calculations follow the latest NTA 2026 and FIRS regulations.
              For complex situations, consult a licensed tax professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
