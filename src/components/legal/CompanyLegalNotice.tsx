import { companyLegalUrl, type CompanyLegalPage } from "@/lib/legal";

const PAGE_LABEL: Record<CompanyLegalPage, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  refunds: "Refund Policy",
};

export function CompanyLegalNotice({ page }: { page: CompanyLegalPage }) {
  const href = companyLegalUrl(page);
  const label = PAGE_LABEL[page];

  return (
    <aside className="mb-8 rounded-md border border-border bg-surface-2 p-4 text-sm text-text-2">
      The current {label} for Ivano Technologies Ltd is published at{" "}
      <a
        href={href}
        className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-2"
      >
        {href.replace(/^https:\/\//, "")}
      </a>
      . If this product page differs, the company page is the source of truth.
    </aside>
  );
}
