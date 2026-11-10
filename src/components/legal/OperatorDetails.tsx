import {
  DATA_PROTECTION_EMAIL,
  GENERAL_CONTACT_EMAIL,
  OPERATOR_ADDRESS,
  OPERATOR_DPO,
  OPERATOR_LEGAL_NAME,
  OPERATOR_RC,
} from "@/lib/legal";

const DEFAULT_LINE =
  "text-light-text-secondary dark:text-dark-text-secondary mb-2";
const DEFAULT_LINK = "text-primary hover:underline";

export function OperatorDetails({
  className,
  lineClassName = DEFAULT_LINE,
  linkClassName = DEFAULT_LINK,
  showEmails = true,
  showWebsite = false,
  websiteHref = "https://techivano.com",
}: {
  className?: string;
  lineClassName?: string;
  linkClassName?: string;
  showEmails?: boolean;
  showWebsite?: boolean;
  websiteHref?: string;
}) {
  return (
    <div className={className}>
      <p className={lineClassName}>
        <strong>{OPERATOR_LEGAL_NAME}</strong>
      </p>
      <p className={lineClassName}>{OPERATOR_RC}</p>
      <p className={lineClassName}>{OPERATOR_ADDRESS}</p>
      <p className={lineClassName}>Data Protection Officer: {OPERATOR_DPO}</p>
      {showEmails ? (
        <>
          <p className={lineClassName}>
            Data-protection requests:{" "}
            <a
              href={`mailto:${DATA_PROTECTION_EMAIL}`}
              className={linkClassName}
            >
              {DATA_PROTECTION_EMAIL}
            </a>
          </p>
          <p className={lineClassName}>
            General enquiries:{" "}
            <a
              href={`mailto:${GENERAL_CONTACT_EMAIL}`}
              className={linkClassName}
            >
              {GENERAL_CONTACT_EMAIL}
            </a>
          </p>
        </>
      ) : null}
      {showWebsite ? (
        <p className={lineClassName}>
          Website:{" "}
          <a href={websiteHref} className={linkClassName}>
            {websiteHref}
          </a>
        </p>
      ) : null}
    </div>
  );
}
