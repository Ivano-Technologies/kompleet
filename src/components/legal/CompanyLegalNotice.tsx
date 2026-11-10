import { companyLegalUrl, type CompanyLegalPage } from "@/lib/legal";

const PAGE_LABEL: Record<CompanyLegalPage, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  refunds: "Refund Policy",
};

export function CompanyLegalNotice({ page }: { page: CompanyLegalPage }) {
  const href = companyLegalUrl(page);
  const label = PAGE_LABEL[page];

  let governs: string;
  switch (page) {
    case "privacy":
      governs = "This page governs personal data processed inside Kompleet.";
      break;
    case "terms":
      governs = "This page governs your use of Kompleet.";
      break;
    case "refunds":
      governs = "This page governs refunds for Kompleet.";
      break;
    default: {
      const _exhaustive: never = page;
      throw new Error(`Unhandled legal page: ${_exhaustive}`);
    }
  }

  return (
    <aside className="mb-8 rounded-md border border-border bg-surface-2 p-4 text-sm text-text-2 dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text-2">
      {governs} The company {label} at{" "}
      <a
        href={href}
        className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-2"
      >
        {href.replace(/^https:\/\//, "")}
      </a>{" "}
      covers the Ivano Technologies Ltd website, contact and company
      dealings.
    </aside>
  );
}
