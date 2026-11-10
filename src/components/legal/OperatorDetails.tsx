import {
  DATA_PROTECTION_EMAIL,
  GENERAL_CONTACT_EMAIL,
  OPERATOR_ADDRESS,
  OPERATOR_DPO,
  OPERATOR_LEGAL_NAME,
  OPERATOR_RC,
  OPERATOR_WEBSITE_HREF,
} from "@/lib/legal";

const DEFAULT_LINE =
  "text-light-text-secondary dark:text-dark-text-secondary mb-2";
const DEFAULT_LINK = "text-primary hover:underline";

export function OperatorDetails({
  className,
  lineClassName = DEFAULT_LINE,
  linkClassName = DEFAULT_LINK,
  showEmails = true,
  showRc = true,
  showDpo = true,
  showWebsite = false,
  websiteHref = OPERATOR_WEBSITE_HREF,
}: {
  className?: string;
  lineClassName?: string;
  linkClassName?: string;
  showEmails?: boolean;
  showRc?: boolean;
  showDpo?: boolean;
  showWebsite?: boolean;
  websiteHref?: string;
}) {
  const websiteLabel = websiteHref.replace(/^https:\/\//, "");

  return (
    <div className={className}>
      <p className={lineClassName}>
        <strong>{OPERATOR_LEGAL_NAME}</strong>
      </p>
      {showRc ? <p className={lineClassName}>{OPERATOR_RC}</p> : null}
      <p className={lineClassName}>{OPERATOR_ADDRESS}</p>
      {showDpo ? (
        <p className={lineClassName}>Data Protection Officer: {OPERATOR_DPO}</p>
      ) : null}
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
            {websiteLabel}
          </a>
        </p>
      ) : null}
    </div>
  );
}
