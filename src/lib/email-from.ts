/**
 * Sender ("From") address for transactional email sent via Resend.
 *
 * The Resend key is scoped to the verified techivano.com domain, so the
 * fallback must stay on that domain. Override with CONTACT_EMAIL_FROM
 * (contact form) or AUTH_EMAIL_FROM (shared with Convex auth emails).
 */
export const DEFAULT_EMAIL_FROM = "Kompleet <noreply@techivano.com>";

export function getEmailFrom(): string {
  return (
    process.env.CONTACT_EMAIL_FROM?.trim() ||
    process.env.AUTH_EMAIL_FROM?.trim() ||
    DEFAULT_EMAIL_FROM
  );
}
