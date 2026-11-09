import { Fragment } from "react";
import { COMPANY_LEGAL } from "@/lib/legal";

const LINKS = [
  { href: COMPANY_LEGAL.terms, label: "Terms" },
  { href: COMPANY_LEGAL.privacy, label: "Privacy" },
  { href: COMPANY_LEGAL.refunds, label: "Refunds" },
] as const;

export function CompanyLegalLinks({
  className = "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-text-2",
  linkClassName = "hover:text-text-1",
}: {
  className?: string;
  linkClassName?: string;
}) {
  return (
    <nav aria-label="Legal" className={className}>
      {LINKS.map((link, index) => (
        <Fragment key={link.href}>
          {index > 0 ? (
            <span aria-hidden="true" className="text-text-3">
              ·
            </span>
          ) : null}
          <a href={link.href} className={linkClassName}>
            {link.label}
          </a>
        </Fragment>
      ))}
    </nav>
  );
}
